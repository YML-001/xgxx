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
  section: [
    { section: "本科室办理" },
    { key: "sec-home", label: "科室工作台", ico: "dashboard" },
    { key: "sec-inbox", label: "科室收件箱", ico: "inbox" },
    { section: "信息公开" },
    { key: "public", label: "公开信件", ico: "megaphone" },
    { key: "policy", label: "制度文件", ico: "doc" }
  ],
  admin: [
    { section: "办理" },
    { key: "admin-home", label: "办理工作台", ico: "dashboard" },
    { key: "inbox", label: "信件收件箱", ico: "inbox" },
    { key: "supervise", label: "督办催办", ico: "clock" },
    { section: "运营" },
    { key: "publish", label: "来信选登管理", ico: "megaphone" },
    { key: "analytics", label: "统计分析", ico: "trend" },
    { section: "配置" },
    { key: "category-mgr", label: "分类管理", ico: "tags" },
    { key: "section-mgr", label: "科室管理", ico: "building" },
    { key: "policy-mgr", label: "制度文件管理", ico: "book" },
    { key: "sla-mgr", label: "超期与催办配置", ico: "clock" },
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
  "sec-home": ["科室工作台", "本科室 / 工作台"],
  "sec-inbox": ["科室收件箱", "本科室 / 收件箱"],
  "admin-home": ["办理工作台", "办理 / 工作台"],
  "inbox": ["信件收件箱", "办理 / 收件箱"],
  "supervise": ["督办催办", "办理 / 督办催办"],
  "publish": ["来信选登管理", "运营 / 来信选登"],
  "analytics": ["统计分析", "运营 / 统计分析"],
  "category-mgr": ["分类管理", "配置 / 分类管理"],
  "section-mgr": ["科室管理", "配置 / 科室管理"],
  "policy-mgr": ["制度文件管理", "配置 / 制度文件管理"],
  "sla-mgr": ["超期与催办配置", "配置 / 超期与催办配置"],
  "faq-mgr": ["常见问题配置", "配置 / 常见问题配置"]
};

const App = {
  role: "student",
  section: "",
  mailbox: "学工信箱",
  route: "home",
  state: {},

  homeRoute() {
    return this.role === "admin" ? "admin-home" : (this.role === "section" ? "sec-home" : "home");
  },

  /* ---------------- 初始化 ---------------- */
  init() {
    this.role = getRole();
    this.section = getSection();
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
    return { student: "学生视角", section: "科室负责人视角", admin: "管理员视角" }[this.role] || "学生视角";
  },

  renderRoleSwitch() {
    const el = document.getElementById("role-switch");
    const roles = [{ k: "student", t: "学生" }, { k: "section", t: "科室负责人" }, { k: "admin", t: "管理员" }];
    el.innerHTML = roles.map(r =>
      `<button data-role="${r.k}" class="${this.role === r.k ? "active" : ""}">${r.t}</button>`
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
    this.renderRoleSwitch();
    this.renderContextSwitch();
    this.renderUser();
    document.getElementById("role-badge").textContent = this.roleLabel();
    document.getElementById("btn-write-quick").style.display = this.role === "student" ? "" : "none";
  },

  renderUser() {
    const set = (avatar, name, sub) => {
      document.getElementById("user-avatar").textContent = avatar;
      document.getElementById("user-name").textContent = name;
      document.getElementById("user-sub").textContent = sub;
    };
    if (this.role === "admin") {
      set(MOCK.admin.avatar, MOCK.admin.name, MOCK.admin.role);
    } else if (this.role === "section") {
      const sec = MOCK.sections.find(s => s.name === this.section) || MOCK.sections[0];
      set(sec.head.charAt(0), sec.head, sec.name + " · 负责人");
    } else {
      set(MOCK.user.avatar, MOCK.user.name, MOCK.user.college);
    }
    document.getElementById("role-badge").textContent = this.roleLabel();
    document.getElementById("btn-write-quick").style.display = this.role === "student" ? "" : "none";
  },

  /* 顶栏上下文切换：科室负责人可切换所属科室（演示用） */
  renderContextSwitch() {
    const el = document.getElementById("mailbox-switch");
    if (this.role !== "section") { el.innerHTML = ""; el.style.display = "none"; return; }
    el.style.display = "";
    el.innerHTML = `<span class="switch-label">科室</span>` + MOCK.sections.map(s =>
      `<button data-sec="${escapeHtml(s.name)}" class="${this.section === s.name ? "active" : ""}">${s.name}</button>`
    ).join("");
    el.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        this.section = b.dataset.sec; saveSection(this.section);
        this.renderContextSwitch(); this.renderUser(); this.render();
      });
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
    if (key === "my") return getMyLetters().filter(l => l.status !== "草稿" && l.mailbox === this.mailbox).length || "";
    if (key === "inbox") return all.filter(l => l.status === "办理中").length || "";
    if (key === "supervise") return all.filter(l => isOverdue(l)).length || "";
    if (key === "sec-inbox") return getSectionLetters(this.section).filter(l => l.status === "办理中").length || "";
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
      "sec-home": () => this.renderSectionHome(),
      "sec-inbox": () => this.renderSectionInbox(),
      "admin-home": () => this.renderAdminHome(),
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

  catBadge(cat) {
    const c = (MOCK.letterCategories.find(x => x.label === cat) || {}).color || "#9096A2";
    return `<span class="badge" style="background:${c}1a;color:${c}">${cat}</span>`;
  },

  /* 列表标题下的正文摘要（空内容返回空串，调用处自动跳过） */
  cellExcerpt(l) {
    const e = contentExcerpt(l.content, 56);
    return e ? `<div class="cell-excerpt">${escapeHtml(e)}</div>` : "";
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
    const mine = getMyLetters().filter(l => l.status !== "草稿" && l.mailbox === this.mailbox);
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const doing = all.filter(l => l.status === "办理中").length;
    const done = all.filter(l => l.status === "已办结").length;
    const pub = filterLetters(getAllLetters(), { mailbox: this.mailbox }).filter(l => l.isPublic === "yes" && l.status === "已办结").slice(0, 5);

    this.afterRender = () => {
      document.querySelectorAll("[data-quick]").forEach(c =>
        c.addEventListener("click", () => this.navigate(c.dataset.quick === "write" ? "write-notice" : c.dataset.quick)));
      document.querySelectorAll("[data-open-public]").forEach(r =>
        r.addEventListener("click", () => this.showPublicDetail(r.dataset.openPublic)));
      this.drawDonut("home-donut", [
        { label: "办理中", value: doing, color: "#3087CC" },
        { label: "已办结", value: done, color: "#1BB975" }
      ]);
    };

    return `
    <div class="hero">
      <h2>倾听每一份诉求，回应每一份期待</h2>
      <p>学工信箱是学校与学生之间的连心桥。您反映的问题、提出的建议、寻求的帮助，都将被认真受理、快速办理、及时反馈。接诉即办，件件有回音。</p>
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
          <table><thead><tr><th>标题</th><th style="width:120px">答复科室</th><th style="width:100px">时间</th></tr></thead>
          <tbody>
            ${pub.length ? pub.map(l => `<tr class="clickable" data-open-public="${l.id}">
              <td>${escapeHtml(l.title)}${this.cellExcerpt(l)}</td><td>${l.dept}</td><td>${l.date}</td></tr>`).join("")
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
              <div class="legend-item"><span class="lg-dot" style="background:#3087CC"></span>办理中<span class="lg-val">${doing}</span></div>
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
          <li>为便于核实与回访，建议使用真实姓名与联系方式；不愿公开的可选择「不公开」。</li>
          <li>同一事项已办结后，请勿以相同事实和理由重复提交。</li>
        </ol>
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
          <div class="form-group"><label class="form-required">能否公开</label>
            <div class="radio-group">
              <label><input type="radio" name="isPublic" value="yes" ${draft.isPublic !== "no" ? "checked" : ""}> 可公开</label>
              <label><input type="radio" name="isPublic" value="no" ${draft.isPublic === "no" ? "checked" : ""}> 不公开</label>
            </div>
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
      const d = MOCK.affairToSection[affair.value];
      deptHint.textContent = d ? `该事务将归口至：${d}` : "";
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
      l.status !== "草稿" && l.mailbox === this.mailbox && l.title === title);

    document.getElementById("btn-cancel").addEventListener("click", () => this.navigate("home"));

    document.getElementById("btn-draft").addEventListener("click", () => {
      const o = collect();
      const existing = getDraft(this.mailbox);
      const letter = Object.assign(existing || {
        id: genLetterId(), owner: "me", mailbox: this.mailbox,
        createdAt: new Date().toISOString(), date: formatDate(new Date())
      }, o, { status: "草稿" });
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
        mailbox: this.mailbox, status: "办理中",
        dept: MOCK.affairToSection[o.affair] || "综合办公室",
        createdAt: now.toISOString(), date: formatDate(now),
        deadline: calcDeadline(now),
        urged: false, reopened: false, reply: null, rating: null
      });
      upsertLetter(letter);
      this.toast(`提交成功！信件编号 ${letter.id}`);
      this.navigate("my");
    });
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
      "全部": list.filter(l => l.status !== "草稿").length,
      "草稿": list.filter(l => l.status === "草稿").length,
      "办理中": list.filter(l => l.status === "办理中").length,
      "已办结": list.filter(l => l.status === "已办结").length
    };
    if (tab === "全部") list = list.filter(l => l.status !== "草稿");
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

    const tabs = ["全部", "办理中", "已办结", "草稿"];
    return `
    ${this.filterBar("my", [
      { name: "title", label: "信件标题", type: "text" },
      { name: "content", label: "信件内容", type: "text" },
      { name: "dept", label: "答复科室", type: "text" }
    ])}
    <div class="tabs">
      ${tabs.map(t => `<button class="tab ${tab === t ? "active" : ""}" data-tab="${t}">${t} <span class="cnt">${counts[t]}</span></button>`).join("")}
    </div>
    <div class="card"><div class="card-body" style="padding:0">
      <table><thead><tr>
        <th style="width:140px">信件编号</th><th>标题</th><th style="width:80px">分类</th>
        <th style="width:100px">答复科室</th><th style="width:95px">来信时间</th><th style="width:90px">状态</th>
        <th style="width:200px">操作</th>
      </tr></thead><tbody>
        ${pg.rows.length ? pg.rows.map(l => `<tr class="clickable" data-open="${l.id}">
          <td class="mono">${l.id}</td>
          <td>${escapeHtml(l.title)} ${l.urged ? '<span class="tag warn">已催办</span>' : ""} ${isOverdue(l) ? '<span class="tag overdue">超期</span>' : ""} ${l.supplements && l.supplements.length ? '<span class="tag info">已补充</span>' : ""}${this.cellExcerpt(l)}</td>
          <td>${this.catBadge(l.category)}</td>
          <td>${l.dept || "-"}</td>
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
    if (l.status === "草稿") {
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

  letterDetailHtml(l, mode) {
    const log = buildProcessLog(l);
    const supsHtml = supplementItemsHtml(l, "tag");
    const urgeHtml = reminderItemsHtml(l);
    return `
    <div class="detail-head">
      <div>
        <h4>${escapeHtml(l.title)}</h4>
        <div class="detail-meta">
          <span class="mono">${l.id}</span> · ${l.mailbox} · ${l.date}
        </div>
      </div>
      ${this.statusBadge(l.status)}
    </div>
    <div style="margin:10px 0">
      ${this.catBadge(l.category)} <span class="tag">${l.affair}</span>
      <span class="tag">归口：${l.dept}</span> <span class="tag">办结时限：${effectiveDeadline(l)}</span>
      ${isOverdue(l) ? '<span class="tag overdue">已超期</span>' : ""}
      ${l.supplements && l.supplements.length ? '<span class="tag info">已补充材料</span>' : ""}
      ${l.urged ? '<span class="tag warn">已催办</span>' : ""}
    </div>
    <div class="detail-section"><div class="sec-title">信件内容</div>
      <div class="rich-content">${contentHtml(l.content)}</div>
      ${l.attachments && l.attachments.length ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">${attachChipsHtml(l.attachments, "tag")}</div>` : ""}
    </div>
    ${supsHtml ? `<div class="detail-section"><div class="sec-title">补充材料</div>${supsHtml}</div>` : ""}
    ${urgeHtml ? `<div class="detail-section"><div class="sec-title">催办记录</div>${urgeHtml}</div>` : ""}
    <div class="detail-section"><div class="sec-title">办理流程</div>
      <div class="timeline">
        ${log.map(s => `<div class="tl-item"><div class="tl-step">${s.step}</div>
          <div class="tl-meta">${s.time} · ${s.actor}</div>
          <div class="tl-note">${s.note}</div></div>`).join("")}
        ${l.status !== "已办结" && l.status !== "已撤回" ? `<div class="tl-item pending"><div class="tl-step" style="color:var(--text-muted)">待答复反馈</div></div>` : ""}
      </div>
    </div>
    <div class="detail-section"><div class="sec-title">办理答复</div>
      ${l.reply ? `<div class="reply-box"><div class="pre-wrap" style="background:transparent;padding:0">${escapeHtml(l.reply.content)}</div>
        <div class="reply-time">—— ${l.reply.dept} · ${l.reply.time}</div></div>`
        : `<div class="no-reply">归口科室正在办理中，请耐心等待答复</div>`}
    </div>
    ${mode === "student" ? this.studentActionsHtml(l) : ""}`;
  },

  studentActionsHtml(l) {
    if (l.status === "已办结") {
      return `<div class="detail-section"><div class="sec-title">满意度评价</div>
        ${l.rating ? this.ratingDoneHtml(l) : this.ratingFormHtml()}
      </div>
      ${l.rating ? `<div class="modal-actions">
        <button class="btn btn-outline" id="d-reopen">对结果不满意，申请二次办理</button>
      </div>` : ""}`;
    }
    if (l.status === "已撤回") return "";
    return `<div class="modal-actions">
      <button class="btn btn-outline" id="d-supplement">补充材料</button>
      <button class="btn btn-outline" id="d-urge" ${l.urged ? "disabled" : ""}>${l.urged ? "已催办" : "催办"}</button>
      ${l.status === "办理中" ? `<button class="btn btn-danger" id="d-withdraw">撤回信件</button>` : ""}
    </div>`;
  },

  /* 列表行内操作：按状态仅展示可用动作，点击不打开详情 */
  studentRowActionsHtml(l) {
    if (l.status === "草稿") {
      return `<div class="table-actions" data-stop>
        <button class="btn btn-primary btn-sm" data-act="edit" data-id="${l.id}">编辑</button>
        <button class="btn btn-danger btn-sm" data-act="del-draft" data-id="${l.id}">删除</button>
      </div>`;
    }
    if (l.status === "办理中") {
      return `<div class="table-actions" data-stop>
        <button class="btn btn-outline btn-sm" data-act="supplement" data-id="${l.id}">补充</button>
        <button class="btn btn-outline btn-sm" data-act="urge" data-id="${l.id}" ${l.urged ? "disabled" : ""}>${l.urged ? "已催办" : "催办"}</button>
        <button class="btn btn-danger btn-sm" data-act="withdraw" data-id="${l.id}">撤回</button>
      </div>`;
    }
    if (l.status === "已办结") {
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
          l.status = "已撤回"; upsertLetter(l);
          this.toast("信件已撤回"); this.render(); return;
        }
        if (act === "rate") { this.showMyDetail(id); return; }
        if (act === "reopen") {
          l.status = "办理中"; l.reopened = true; l.reply = null;
          l.rating = null; l.ratingComment = ""; l.ratingTags = []; l.ratedAt = null;
          l.deadline = calcDeadline(new Date()); upsertLetter(l);
          this.toast("已申请二次办理，信件重新进入办理流程"); this.render();
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
        l.rating = sel;
        const ta = document.getElementById("rating-comment");
        l.ratingComment = ta ? ta.value.trim() : "";
        l.ratingTags = tagWrap ? [...tagWrap.querySelectorAll(".rate-chip.on")].map(c => c.dataset.tag) : [];
        l.ratedAt = formatDate(new Date());
        upsertLetter(l);
        this.toast("感谢您的评价！"); this.showMyDetail(l.id); this.renderSidebar();
      });
    }
    const reopen = document.getElementById("d-reopen");
    if (reopen) reopen.addEventListener("click", () => {
      l.status = "办理中"; l.reopened = true; l.reply = null;
      l.rating = null; l.ratingComment = ""; l.ratingTags = []; l.ratedAt = null;
      l.deadline = calcDeadline(new Date()); upsertLetter(l);
      this.toast("已申请二次办理，信件重新进入办理流程"); this.hideModal(); this.render();
    });
    const sup = document.getElementById("d-supplement");
    if (sup) sup.addEventListener("click", () => this.showSupplement(l));
    const urge = document.getElementById("d-urge");
    if (urge) urge.addEventListener("click", () => this.showUrge(l, () => { this.showMyDetail(l.id); this.renderSidebar(); }));
    const withdraw = document.getElementById("d-withdraw");
    if (withdraw) withdraw.addEventListener("click", () => {
      l.status = "已撤回"; upsertLetter(l);
      this.toast("信件已撤回"); this.hideModal(); this.render();
    });
  },

  /* 催办：预览填充后的催办模板 + 选择渠道 + 发送并记录 */
  showUrge(l, onDone, by) {
    const channels = (MOCK.urgeChannels || ["sys"]).slice();
    this.showModal("催办", `
      <p class="form-hint" style="color:var(--text-muted);margin-bottom:12px">以下催办通知将发送至该信件归口科室（<b>${escapeHtml(l.dept)}</b>）：</p>
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
      this.toast(`已通过${channelLabel(ch)}催办至${l.dept}`);
      if (onDone) onDone(); else this.hideModal();
    });
    const cancel = document.getElementById("urge-cancel");
    if (cancel) cancel.addEventListener("click", () => { if (onDone) onDone(); else this.hideModal(); });
  },

  showSupplement(l) {
    this.showModal("补充材料", `
      <p class="form-hint" style="color:var(--text-muted);margin-bottom:12px">补充与本诉求相关的情况说明或材料，提交后归口科室办理时即可查看。</p>
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
      upsertLetter(l); this.toast("补充材料已提交，归口科室可查看"); this.showMyDetail(l.id);
    });
    const cancel = document.getElementById("sup-cancel");
    if (cancel) cancel.addEventListener("click", () => this.showMyDetail(l.id));
  },

  /* ---------- 信件查询（编号快速查询 + 多条件组合查询） ---------- */
  renderQuery() {
    const f = this.state.queryFilter || {};
    const hasCond = Object.keys(f).some(k => f[k]);
    const results = filterLetters(getAllLetters(), Object.assign({ mailbox: this.mailbox }, f))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pg = this.paginate(results, this.state.queryPage, 8);
    const recent = getAllLetters().slice(0, 4);

    this.afterRender = () => {
      const btn = document.getElementById("q-btn");
      const input = document.getElementById("q-input");
      const run = () => {
        const id = input.value.trim();
        const l = getLetterById(id);
        const box = document.getElementById("q-result");
        if (!id) { box.innerHTML = `<div class="no-reply">请输入信件编号</div>`; return; }
        if (!l || l.status === "草稿") { box.innerHTML = `<div class="no-reply">未查询到编号为 <b>${escapeHtml(id)}</b> 的信件</div>`; return; }
        box.innerHTML = this.letterDetailHtml(l, "view");
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
      { name: "status", label: "办理状态", type: "select", options: ["办理中", "已办结"] },
      { name: "section", label: "归口科室", type: "select", options: MOCK.sections.map(s => s.name) },
      { name: "start", label: "起始日期", type: "date" },
      { name: "end", label: "截止日期", type: "date" }
    ])}
    <div class="card">
      <div class="card-header"><h3>查询结果</h3><span class="hint">${hasCond ? `按条件筛选 · 共 ${results.length} 封` : `默认展示最近来信 · 共 ${results.length} 封`}</span></div>
      <div class="card-body" style="padding:0">
        <table><thead><tr>
          <th style="width:140px">信件编号</th><th>标题</th><th style="width:80px">分类</th>
          <th style="width:110px">归口科室</th><th style="width:90px">状态</th><th style="width:95px">来信时间</th>
          <th style="width:200px">操作</th>
        </tr></thead><tbody>
          ${pg.rows.length ? pg.rows.map(l => `<tr class="clickable" data-open-public="${l.id}">
            <td class="mono">${l.id}</td>
            <td>${escapeHtml(l.title)}${this.cellExcerpt(l)}</td>
            <td>${this.catBadge(l.category)}</td>
            <td>${l.dept || "-"}</td>
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
    let list = getAllLetters().filter(l => l.mailbox === this.mailbox && l.isPublic === "yes" && l.status === "已办结");
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
      { name: "dept", label: "答复科室", type: "text" }
    ])}
    <div class="card"><div class="card-body" style="padding:0">
      <table><thead><tr><th style="width:60px">序号</th><th>标题</th><th style="width:90px">分类</th><th style="width:120px">答复科室</th><th style="width:100px">时间</th></tr></thead>
      <tbody>
        ${pg.rows.length ? pg.rows.map((l, i) => `<tr class="clickable" data-open-public="${l.id}">
          <td>${(pg.page - 1) * 8 + i + 1}</td><td>${escapeHtml(l.title)}${this.cellExcerpt(l)}</td>
          <td>${this.catBadge(l.category)}</td><td>${l.dept}</td><td>${l.date}</td></tr>`).join("")
          : `<tr><td colspan="5" class="table-empty">暂无公开信件</td></tr>`}
      </tbody></table>
    </div></div>
    ${this.pagerHtml(pg.page, pg.total, "pubPage")}`;
  },

  showPublicDetail(id) {
    const l = getLetterById(id);
    if (!l) return;
    this.showModal("公开信件", this.letterDetailHtml(l, "view"));
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
          <td><span class="badge" style="background:${p.status === "现行有效" ? "#1BB9751a;color:#1BB975" : "#9096A21a;color:#9096A2"}">${p.status}</span></td>
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
    const statusBadge = `<span class="badge" style="background:${effective ? "#1BB9751a;color:#1BB975" : "#9096A21a;color:#9096A2"}">${p.status}</span>`;
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
    all.forEach(l => byDept[l.dept] = (byDept[l.dept] || 0) + 1);
    const deptRows = Object.entries(byDept).sort((a, b) => b[1] - a[1]);

    this.afterRender = () => {
      this.drawDonut("stat-donut", byCat);
      this.drawBars("stat-bars", deptRows.slice(0, 6).map(([k, v]) => ({ label: k.replace(/（.*）/, ""), value: v })));
    };

    const done = all.filter(l => l.status === "已办结").length;
    return `
    <div class="stat-grid">
      ${this.statCard("累计来信", all.length, "封 · " + this.mailbox, "#3087CC")}
      ${this.statCard("已办结", done, `办结率 ${all.length ? Math.round(done / all.length * 100) : 0}%`, "#1BB975")}
      ${this.statCard("平均办理时长", "3.6", "工作日", "#3087CC")}
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
      <div class="card"><div class="card-header"><h3>各科室来信量（Top6）</h3></div>
        <div class="card-body"><canvas id="stat-bars" width="440" height="220" style="max-width:100%"></canvas></div>
      </div>
    </div>
    <div class="card"><div class="card-header"><h3>科室办理统计</h3></div>
      <div class="card-body" style="padding:0">
        <table><thead><tr><th style="width:60px">序号</th><th>答复科室</th><th>来信量</th><th>已办结</th><th>办结率</th></tr></thead>
        <tbody>
          ${deptRows.map(([d, v], i) => {
            const dn = all.filter(l => l.dept === d && l.status === "已办结").length;
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
    <p class="section-title">学生工作部各科室负责人、联系方式与职责分工</p>
    <div class="dept-grid">
      ${MOCK.sections.map(d => `<div class="dept-card">
        <h4>${d.name}</h4>
        <div class="dept-head">负责人：${escapeHtml(d.head)}</div>
        <div class="phone">${svgIcon("phone")} ${d.phone}</div>
        <div class="dept-email">${svgIcon("mail")} ${escapeHtml(d.email || "-")}</div>
        <div class="duty">${d.duty}</div>
        <div>${d.affairs.map(a => `<span class="tag">${a}</span>`).join("")}</div>
      </div>`).join("")}
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
  /* ---------- 办理工作台 ---------- */
  renderAdminHome() {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const doing = all.filter(l => l.status === "办理中");
    const done = all.filter(l => l.status === "已办结");
    const overdue = all.filter(l => isOverdue(l));
    const todo = all.filter(l => l.status === "办理中")
      .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));

    this.afterRender = () => {
      document.querySelectorAll("[data-handle]").forEach(r =>
        r.addEventListener("click", () => this.showHandle(r.dataset.handle)));
      const donut = [
        { label: "办理中", value: doing.length, color: "#3087CC" },
        { label: "已办结", value: done.length, color: "#1BB975" }
      ].filter(x => x.value);
      this.drawDonut("admin-donut", donut);
    };

    return `
    <div class="stat-grid">
      ${this.statCard("累计来信", all.length, this.mailbox, "#006DAD")}
      ${this.statCard("办理中", doing.length, "正在处理", "#3087CC")}
      ${this.statCard("已办结", done.length, "本周期", "#1BB975")}
      ${this.statCard("超期预警", overdue.length, "需督办", "#DF2027")}
    </div>
    <div class="grid-3-2">
      <div class="card">
        <div class="card-header"><h3>我的待办</h3><span class="hint">按办理时限升序</span></div>
        <div class="card-body" style="padding:0">
          <table><thead><tr><th style="width:140px">编号</th><th>标题</th><th style="width:110px">归口科室</th><th style="width:95px">办结时限</th><th style="width:90px">状态</th></tr></thead>
          <tbody>
            ${todo.length ? todo.slice(0, 8).map(l => `<tr class="clickable" data-handle="${l.id}">
              <td class="mono">${l.id}</td>
              <td>${escapeHtml(l.title)} ${l.urged ? '<span class="tag warn">催办</span>' : ""} ${l.supplements && l.supplements.length ? '<span class="tag info">已补充</span>' : ""}${this.cellExcerpt(l)}</td>
              <td>${l.dept}</td>
              <td>${effectiveDeadline(l)} ${isOverdue(l) ? '<span class="tag overdue">超期</span>' : ""}</td>
              <td>${this.statusBadge(l.status)}</td></tr>`).join("")
              : `<tr><td colspan="5" class="table-empty">暂无待办信件</td></tr>`}
          </tbody></table>
        </div>
      </div>
      <div class="card"><div class="card-header"><h3>办理情况概览</h3></div>
        <div class="card-body"><div class="chart-wrap">
          <canvas id="admin-donut" width="150" height="150"></canvas>
          <div class="chart-legend">
            <div class="legend-item"><span class="lg-dot" style="background:#3087CC"></span>办理中<span class="lg-val">${doing.length}</span></div>
            <div class="legend-item"><span class="lg-dot" style="background:#1BB975"></span>已办结<span class="lg-val">${done.length}</span></div>
          </div>
        </div></div>
      </div>
    </div>`;
  },

  /* ---------- 信件收件箱 ---------- */
  renderInbox() {
    const f = this.state.inboxFilter || {};
    let list = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const tab = this.state.inboxTab || "全部";
    const counts = {
      "全部": list.length,
      "办理中": list.filter(l => l.status === "办理中").length,
      "已办结": list.filter(l => l.status === "已办结").length
    };
    if (tab !== "全部") list = list.filter(l => l.status === tab);
    list = filterLetters(list, f).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pg = this.paginate(list, this.state.inboxPage, 8);

    this.afterRender = () => {
      document.querySelectorAll("[data-tab]").forEach(t => t.addEventListener("click", () => {
        this.state.inboxTab = t.dataset.tab; this.state.inboxPage = 1; this.render();
      }));
      this.bindFilter("inbox");
      document.querySelectorAll("[data-handle]").forEach(r =>
        r.addEventListener("click", () => this.showHandle(r.dataset.handle)));
    };
    const tabs = ["全部", "办理中", "已办结"];
    return `
    ${this.filterBar("inbox", [
      { name: "title", label: "信件标题", type: "text" },
      { name: "category", label: "信件分类", type: "select", options: MOCK.letterCategories.map(c => c.label) },
      { name: "dept", label: "归口科室", type: "text" }
    ])}
    <div class="tabs">
      ${tabs.map(t => `<button class="tab ${tab === t ? "active" : ""}" data-tab="${t}">${t} <span class="cnt">${counts[t]}</span></button>`).join("")}
    </div>
    <div class="card"><div class="card-body" style="padding:0">
      <table><thead><tr>
        <th style="width:140px">编号</th><th>标题</th><th style="width:80px">分类</th>
        <th style="width:70px">来信人</th><th style="width:100px">归口科室</th><th style="width:90px">来信时间</th><th style="width:88px">状态</th><th style="width:70px">操作</th>
      </tr></thead><tbody>
        ${pg.rows.length ? pg.rows.map(l => `<tr>
          <td class="mono">${l.id}</td>
          <td>${escapeHtml(l.title)} ${isOverdue(l) ? '<span class="tag overdue">超期</span>' : ""}${this.cellExcerpt(l)}</td>
          <td>${this.catBadge(l.category)}</td>
          <td>${escapeHtml(l.name)}</td>
          <td>${l.dept}</td>
          <td>${l.date}</td>
          <td>${this.statusBadge(l.status)}</td>
          <td><button class="btn btn-primary btn-sm" data-handle="${l.id}">办理</button></td>
        </tr>`).join("") : `<tr><td colspan="8" class="table-empty">暂无信件</td></tr>`}
      </tbody></table>
    </div></div>
    ${this.pagerHtml(pg.page, pg.total, "inboxPage")}`;
  },

  /* ---------- 信件办理详情（管理员 / 科室负责人） ---------- */
  showHandle(id) {
    const l = getLetterById(id);
    if (!l) return;
    const isAdmin = this.role === "admin";
    /* 越权保护：科室负责人只能办理本科室信件 */
    if (!isAdmin && l.dept !== this.section) { this.toast("该信件不属于本科室"); return; }

    const deptField = isAdmin
      ? `<div class="form-group"><label>归口科室（转办）</label>
           <select id="h-dept">${MOCK.sections.map(d => `<option ${d.name === l.dept ? "selected" : ""}>${d.name}</option>`).join("")}</select></div>`
      : `<div class="form-group"><label>归口科室</label>
           <input value="${escapeHtml(l.dept)}" disabled></div>`;

    this.showModal(isAdmin ? "信件办理（管理员）" : "信件办理（本科室）", `
      ${this.letterDetailHtml(l, "view")}
      <div class="detail-section"><div class="sec-title">来信人信息</div>
        <div class="info-grid">
          <div><div class="k">姓名</div><div class="v">${escapeHtml(l.name)}</div></div>
          <div><div class="k">所在单位</div><div class="v">${escapeHtml(l.unit || "-")}</div></div>
          <div><div class="k">联系电话</div><div class="v">${escapeHtml(l.phone || "-")}</div></div>
          <div><div class="k">联系邮箱</div><div class="v">${escapeHtml(l.email || "-")}</div></div>
        </div>
      </div>
      <div class="detail-section"><div class="sec-title">办理操作</div>
        ${deptField}
        <div class="form-group"><label>答复内容</label>
          <textarea id="h-reply" rows="5" placeholder="请填写办理答复">${escapeHtml(l.reply ? l.reply.content : "")}</textarea></div>
      </div>
      <div class="modal-actions">
        ${isAdmin && l.status !== "已办结" ? `<button class="btn btn-primary" id="h-transfer">转办科室</button>` : ""}
        ${isAdmin && l.status !== "已办结" && !l.urged ? `<button class="btn btn-outline" id="h-urge">督办提醒</button>` : ""}
        ${l.status !== "已办结" ? `<button class="btn btn-primary" id="h-done">答复并办结</button>` : `<button class="btn btn-outline" id="h-reopen2">重新打开</button>`}
      </div>`);
    this.bindHandle(l);
    this.bindAttachments(() => this.showHandle(id));
  },

  bindHandle(l) {
    const deptSel = document.getElementById("h-dept");
    const replyBox = document.getElementById("h-reply");
    const save = () => {
      if (deptSel) l.dept = deptSel.value;
      l.deadline = calcDeadline(new Date(l.createdAt));
    };

    const transfer = document.getElementById("h-transfer");
    if (transfer) transfer.addEventListener("click", () => {
      save(); l.status = "办理中"; upsertLetter(l);
      this.toast(`已转办至 ${l.dept}`); this.hideModal(); this.render();
    });
    const urge = document.getElementById("h-urge");
    if (urge) urge.addEventListener("click", () => {
      sendUrge(l, MOCK.urgeChannels, "admin"); upsertLetter(l);
      this.toast(`已通过${channelLabel(MOCK.urgeChannels)}向 ${l.dept} 发送督办提醒`); this.hideModal(); this.render();
    });
    const done = document.getElementById("h-done");
    if (done) done.addEventListener("click", () => {
      const txt = replyBox.value.trim();
      if (!txt) { this.toast("请填写答复内容后再办结"); return; }
      save();
      l.reply = { dept: l.dept, time: formatDateTime(new Date()), content: txt };
      l.status = "已办结"; upsertLetter(l);
      this.toast("信件已答复并办结"); this.hideModal(); this.render();
    });
    const reopen2 = document.getElementById("h-reopen2");
    if (reopen2) reopen2.addEventListener("click", () => {
      l.status = "办理中"; upsertLetter(l);
      this.toast("信件已重新打开"); this.hideModal(); this.render();
    });
  },

  /* ============================================================
   * 科室负责人页面（仅本科室）
   * ============================================================ */
  renderSectionHome() {
    const sec = this.section;
    const list = getSectionLetters(sec);
    const doing = list.filter(l => l.status === "办理中");
    const done = list.filter(l => l.status === "已办结");
    const overdue = list.filter(l => isOverdue(l));
    const todo = list.filter(l => l.status === "办理中")
      .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
    const secObj = MOCK.sections.find(s => s.name === sec) || {};

    this.afterRender = () => {
      document.querySelectorAll("[data-handle]").forEach(r =>
        r.addEventListener("click", () => this.showHandle(r.dataset.handle)));
      this.drawDonut("sec-donut", [
        { label: "办理中", value: doing.length, color: "#3087CC" },
        { label: "已办结", value: done.length, color: "#1BB975" }
      ].filter(x => x.value));
    };

    return `
    <div class="hero hero-compact">
      <h2>${sec} · 工作台</h2>
      <p>负责人 ${escapeHtml(secObj.head || "")} ｜ 承接事务：${(secObj.affairs || []).join("、") || "—"}。本科室仅可查看并办理归口本科室的信件。</p>
    </div>
    <div class="stat-grid">
      ${this.statCard("本科室累计", list.length, "承接总量", "#006DAD")}
      ${this.statCard("办理中", doing.length, "正在处理", "#3087CC")}
      ${this.statCard("已办结", done.length, "本科室累计", "#1BB975")}
      ${this.statCard("超期预警", overdue.length, "需尽快办结", "#DF2027")}
    </div>
    <div class="grid-3-2">
      <div class="card">
        <div class="card-header"><h3>本科室待办</h3><span class="hint">按办理时限升序</span></div>
        <div class="card-body" style="padding:0">
          <table><thead><tr><th style="width:140px">编号</th><th>标题</th><th style="width:90px">分类</th><th style="width:95px">办结时限</th><th style="width:90px">状态</th></tr></thead>
          <tbody>
            ${todo.length ? todo.slice(0, 8).map(l => `<tr class="clickable" data-handle="${l.id}">
              <td class="mono">${l.id}</td>
              <td>${escapeHtml(l.title)} ${l.urged ? '<span class="tag warn">催办</span>' : ""} ${l.supplements && l.supplements.length ? '<span class="tag info">已补充</span>' : ""}${this.cellExcerpt(l)}</td>
              <td>${this.catBadge(l.category)}</td>
              <td>${effectiveDeadline(l)} ${isOverdue(l) ? '<span class="tag overdue">超期</span>' : ""}</td>
              <td>${this.statusBadge(l.status)}</td></tr>`).join("")
              : `<tr><td colspan="5" class="table-empty">本科室暂无待办信件</td></tr>`}
          </tbody></table>
        </div>
      </div>
      <div class="card"><div class="card-header"><h3>本科室办理情况</h3></div>
        <div class="card-body"><div class="chart-wrap">
          <canvas id="sec-donut" width="150" height="150"></canvas>
          <div class="chart-legend">
            <div class="legend-item"><span class="lg-dot" style="background:#3087CC"></span>办理中<span class="lg-val">${doing.length}</span></div>
            <div class="legend-item"><span class="lg-dot" style="background:#1BB975"></span>已办结<span class="lg-val">${done.length}</span></div>
          </div>
        </div></div>
      </div>
    </div>`;
  },

  renderSectionInbox() {
    const sec = this.section;
    const f = this.state.secFilter || {};
    let list = getSectionLetters(sec);
    const tab = this.state.secTab || "全部";
    const counts = {
      "全部": list.length,
      "办理中": list.filter(l => l.status === "办理中").length,
      "已办结": list.filter(l => l.status === "已办结").length
    };
    if (tab !== "全部") list = list.filter(l => l.status === tab);
    list = filterLetters(list, f).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pg = this.paginate(list, this.state.secPage, 8);

    this.afterRender = () => {
      document.querySelectorAll("[data-tab]").forEach(t => t.addEventListener("click", () => {
        this.state.secTab = t.dataset.tab; this.state.secPage = 1; this.render();
      }));
      this.bindFilter("sec");
      document.querySelectorAll("[data-handle]").forEach(r =>
        r.addEventListener("click", () => this.showHandle(r.dataset.handle)));
    };
    const tabs = ["全部", "办理中", "已办结"];
    return `
    <p class="section-title">${sec} · 归口本科室的信件（仅本科室可办理）</p>
    ${this.filterBar("sec", [
      { name: "title", label: "信件标题", type: "text" },
      { name: "category", label: "信件分类", type: "select", options: MOCK.letterCategories.map(c => c.label) },
      { name: "affair", label: "事务分类", type: "select", options: (MOCK.sections.find(s => s.name === sec) || {}).affairs || [] }
    ])}
    <div class="tabs">
      ${tabs.map(t => `<button class="tab ${tab === t ? "active" : ""}" data-tab="${t}">${t} <span class="cnt">${counts[t]}</span></button>`).join("")}
    </div>
    <div class="card"><div class="card-body" style="padding:0">
      <table><thead><tr>
        <th style="width:140px">编号</th><th>标题</th><th style="width:80px">分类</th>
        <th style="width:88px">事务</th><th style="width:66px">来信人</th><th style="width:90px">来信时间</th><th style="width:88px">状态</th><th style="width:70px">操作</th>
      </tr></thead><tbody>
        ${pg.rows.length ? pg.rows.map(l => `<tr>
          <td class="mono">${l.id}</td>
          <td>${escapeHtml(l.title)} ${l.urged ? '<span class="tag warn">催办</span>' : ""} ${isOverdue(l) ? '<span class="tag overdue">超期</span>' : ""} ${l.supplements && l.supplements.length ? '<span class="tag info">已补充</span>' : ""}${this.cellExcerpt(l)}</td>
          <td>${this.catBadge(l.category)}</td>
          <td><span class="tag">${l.affair}</span></td>
          <td>${escapeHtml(l.name)}</td>
          <td>${l.date}</td>
          <td>${this.statusBadge(l.status)}</td>
          <td><button class="btn btn-primary btn-sm" data-handle="${l.id}">办理</button></td>
        </tr>`).join("") : `<tr><td colspan="8" class="table-empty">本科室暂无信件</td></tr>`}
      </tbody></table>
    </div></div>
    ${this.pagerHtml(pg.page, pg.total, "secPage")}`;
  },

  /* ---------- 督办催办 ---------- */
  renderSupervise() {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const overdue = all.filter(l => isOverdue(l));
    const urged = all.filter(l => l.urged && l.status !== "已办结");
    const near = all.filter(l => !isOverdue(l) && l.status === "办理中")
      .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || "")).slice(0, 6);

    this.afterRender = () => {
      document.querySelectorAll("[data-handle]").forEach(r =>
        r.addEventListener("click", () => this.showHandle(r.dataset.handle)));
      this.bindBatchUrge();
    };

    const rowHtml = (l) => `<tr class="clickable" data-handle="${l.id}">
      <td class="sel-cell"><input type="checkbox" class="urge-sel" data-sel="${l.id}" onclick="event.stopPropagation()"></td>
      <td class="mono">${l.id}</td><td>${escapeHtml(l.title)} ${l.urged ? '<span class="tag warn">已催办</span>' : ""}${this.cellExcerpt(l)}</td><td>${l.dept}</td>
      <td>${effectiveDeadline(l)}</td><td>${this.statusBadge(l.status)}</td></tr>`;

    return `
    <div class="stat-grid">
      ${this.statCard("超期未办结", overdue.length, "需重点督办", "#DF2027")}
      ${this.statCard("学生催办", urged.length, "已收到催办", "#F29100")}
      ${this.statCard("临期待办", near.length, "临近办结时限", "#3087CC")}
    </div>
    <div class="card"><div class="card-header"><h3>超期未办结清单</h3>
      <div class="batch-bar">
        <span class="batch-hint" id="batch-hint">已选 0 封</span>
        <button class="btn btn-primary btn-sm" id="btn-batch-urge" disabled>${svgIcon("megaphone")} 批量催办</button>
      </div>
    </div>
      <div class="card-body" style="padding:0"><table><thead><tr><th style="width:40px"><input type="checkbox" id="urge-sel-all" title="全选"></th><th style="width:140px">编号</th><th>标题</th><th style="width:110px">归口科室</th><th style="width:95px">办结时限</th><th style="width:90px">状态</th></tr></thead>
      <tbody>${overdue.length ? overdue.map(rowHtml).join("") : `<tr><td colspan="6" class="table-empty">暂无超期信件，办理情况良好</td></tr>`}</tbody></table></div>
    </div>
    <div class="card"><div class="card-header"><h3>学生催办件</h3><span class="hint">学生主动发起的催办</span></div>
      <div class="card-body" style="padding:0"><table><thead><tr><th style="width:140px">编号</th><th>标题</th><th style="width:110px">归口科室</th><th style="width:95px">办结时限</th><th style="width:90px">状态</th><th style="width:110px">操作</th></tr></thead>
      <tbody>${urged.length ? urged.map(l => `<tr class="clickable" data-handle="${l.id}">
        <td class="mono">${l.id}</td><td>${escapeHtml(l.title)} <span class="tag warn">已催办</span>${this.cellExcerpt(l)}</td><td>${l.dept}</td>
        <td>${effectiveDeadline(l)}</td><td>${this.statusBadge(l.status)}</td>
        <td><button class="btn btn-outline btn-sm" data-handle-btn="${l.id}" onclick="event.stopPropagation()">去办理</button></td></tr>`).join("") : `<tr><td colspan="6" class="table-empty">暂无催办件</td></tr>`}</tbody></table></div>
    </div>`;
  },

  /* 批量催办：多选超期信件，向各自归口科室按模板发送并记录 */
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
    if (btn) btn.addEventListener("click", () => {
      const ids = selectedIds();
      const targets = ids.map(id => getLetterById(id)).filter(l => l && l.status !== "已办结");
      if (!targets.length) { this.toast("请先选择需催办的办理中信件"); return; }
      targets.forEach(l => { sendUrge(l, MOCK.urgeChannels, "admin"); upsertLetter(l); });
      this.toast(`已通过${channelLabel(MOCK.urgeChannels)}批量催办 ${targets.length} 封`);
      this.render();
    });
    refresh();
  },

  /* ---------- 来信选登管理 ---------- */
  renderPublish() {
    let list = filterLetters(getAllLetters(), { mailbox: this.mailbox }).filter(l => l.status === "已办结");
    list = list.sort((a, b) => b.date.localeCompare(a.date));
    const pg = this.paginate(list, this.state.pubmgrPage, 8);
    this.afterRender = () => {
      document.querySelectorAll("[data-open-public]").forEach(r =>
        r.addEventListener("click", () => this.showPublishDetail(r.dataset.openPublic)));
      document.querySelectorAll("[data-toggle-pub]").forEach(b => b.addEventListener("click", (e) => {
        e.stopPropagation();
        const l = getLetterById(b.dataset.togglePub);
        l.isPublic = l.isPublic === "yes" ? "no" : "yes"; upsertLetter(l);
        this.toast(l.isPublic === "yes" ? "已选登公开" : "已取消公开"); this.render();
      }));
    };
    return `
    <p class="section-title">将已办结信件选登公开，展示典型诉求与办理答复（点击行查看信件详情）</p>
    <div class="card"><div class="card-body" style="padding:0">
      <table><thead><tr><th style="width:140px">编号</th><th>标题</th><th style="width:110px">答复科室</th><th style="width:100px">时间</th><th style="width:90px">公开状态</th><th style="width:110px">操作</th></tr></thead>
      <tbody>
        ${pg.rows.length ? pg.rows.map(l => `<tr class="clickable" data-open-public="${l.id}">
          <td class="mono">${l.id}</td><td>${escapeHtml(l.title)}${this.cellExcerpt(l)}</td><td>${l.dept}</td><td>${l.date}</td>
          <td>${l.isPublic === "yes" ? '<span class="badge" style="background:#1BB9751a;color:#1BB975">已公开</span>' : '<span class="badge" style="background:#9096A21a;color:#9096A2">未公开</span>'}</td>
          <td><button class="btn ${l.isPublic === "yes" ? "btn-outline" : "btn-primary"} btn-sm" data-toggle-pub="${l.id}">${l.isPublic === "yes" ? "取消选登" : "选登公开"}</button></td>
        </tr>`).join("") : `<tr><td colspan="6" class="table-empty">暂无已办结信件</td></tr>`}
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
    all.forEach(l => byDept[l.dept] = (byDept[l.dept] || 0) + 1);
    const deptRows = Object.entries(byDept).sort((a, b) => b[1] - a[1]);
    const rated = all.filter(l => l.rating);
    const done = all.filter(l => l.status === "已办结").length;
    const doing = all.filter(l => l.status === "办理中").length;
    const scopeSub = granLabel[gran] + "视角 · " + (f.year ? f.year + "年" : "全部年份");

    /* 维度派生数据 */
    const statusDist = [
      { name: "办理中", value: doing, color: "#3087CC" },
      { name: "已办结", value: done, color: "#1BB975" },
      { name: "已撤回", value: all.filter(l => l.status === "已撤回").length, color: "#9096A2" }
    ].filter(x => x.value);
    const ratingDist = [5, 4, 3, 2, 1].map(s => ({ star: s, value: rated.filter(l => l.rating === s).length }));
    const overdueCnt = all.filter(l => isOverdue(l)).length;
    const overdueDist = [
      { name: "超期未办结", value: overdueCnt, color: "#DF2027" },
      { name: "办理中(正常)", value: doing - overdueCnt, color: "#F29100" },
      { name: "已办结", value: done, color: "#1BB975" }
    ].filter(x => x.value > 0);
    const urgeByDept = {};
    all.forEach(l => { const n = (l.reminders && l.reminders.length) || 0; if (n) urgeByDept[l.dept] = (urgeByDept[l.dept] || 0) + n; });
    const urgeRows = Object.entries(urgeByDept).sort((a, b) => b[1] - a[1]);

    this.afterRender = () => {
      this.echartsDispose();
      const PAL = ["#3087CC", "#5AA9E6", "#1BB975", "#F29100", "#DF2027", "#006DAD", "#9CBFDA", "#7C4DFF"];
      const axisBase = { axisLine: { lineStyle: { color: "#E2E8F0" } }, axisLabel: { color: "#696F7D" }, axisTick: { show: false } };
      // 趋势
      this.echartInit("an-trend", {
        color: ["#3087CC"], grid: { left: 42, right: 20, top: 24, bottom: 40 },
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
        color: ["#3087CC"], grid: { left: 46, right: 16, top: 20, bottom: 78 },
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
        <label class="an-ctrl-label" for="an-dept-filter">归口科室</label>
        <select id="an-dept-filter"><option value="">全部科室</option>${MOCK.sections.map(s => `<option ${f.dept === s.name ? "selected" : ""}>${s.name}</option>`).join("")}</select>
      </div>
      <button class="btn btn-outline btn-sm" id="an-reset">重置</button>
    </div>

    <div class="stat-grid">
      ${this.statCard("来信总量", all.length, scopeSub, "#3087CC")}
      ${this.statCard("办结率", (all.length ? Math.round(done / all.length * 100) : 0) + "%", "已办结 / 总量", "#1BB975")}
      ${this.statCard("参评量", rated.length, "已评价信件", "#3087CC")}
      ${this.statCard("好评率", this.satisfactionRate(all) + "%", "4星及以上", "#F29100")}
    </div>

    <div class="card">
      <div class="card-header"><h3>${svgIcon("trend")} 来信量趋势（${granLabel[gran]}）</h3><span class="card-hint">共 ${trend.length} 个区间 · ${all.length} 封</span></div>
      <div class="card-body">${trend.length ? '<div class="echart" id="an-trend" style="height:280px"></div>' : emptyNote}</div>
    </div>

    <div class="two-col">
      <div class="card"><div class="card-header"><h3>${svgIcon("chart")} 信件分类占比</h3></div>
        <div class="card-body">${byCat.length ? '<div class="echart" id="an-cat" style="height:300px"></div>' : emptyNote}</div>
      </div>
      <div class="card"><div class="card-header"><h3>${svgIcon("building")} 科室来信量</h3></div>
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

    <div class="card"><div class="card-header"><h3>${svgIcon("chart")} 科室办理绩效</h3></div>
      <div class="card-body" style="padding:0">
        <table><thead><tr><th style="width:56px">序号</th><th>归口科室</th><th>承接量</th><th>已办结</th><th>办结率</th><th>平均满意度</th></tr></thead>
        <tbody>
          ${deptRows.length ? deptRows.map(([d, v], i) => {
            const items = all.filter(l => l.dept === d);
            const dn = items.filter(l => l.status === "已办结").length;
            const rd = items.filter(l => l.rating);
            const avg = rd.length ? (rd.reduce((s, x) => s + x.rating, 0) / rd.length).toFixed(1) : "-";
            return `<tr><td>${i + 1}</td><td>${d}</td><td>${v}</td><td>${dn}</td><td>${Math.round(dn / v * 100)}%</td><td>${avg === "-" ? "-" : "★ " + avg}</td></tr>`;
          }).join("") : `<tr><td colspan="6" class="table-empty">暂无数据</td></tr>`}
        </tbody></table>
      </div>
    </div>`;
  },

  /* ---------- 分类管理（信件分类 / 事务分类 + 科室绑定） ---------- */
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
    <p class="section-title">维护信件分类与事务分类，并为每类事务绑定归口科室</p>
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
          <table><thead><tr><th>事务名称</th><th>归口科室</th><th style="width:70px">来信</th><th style="width:120px">操作</th></tr></thead>
          <tbody>
            ${affairs.map((a, i) => `<tr>
              <td>${escapeHtml(a.name)}</td>
              <td>${a.dept ? `<span class="tag">${escapeHtml(a.dept)}</span>` : '<span class="tag warn">未绑定</span>'}</td>
              <td>${usage(a.name, "affair")}</td>
              <td class="table-actions">
                <button class="btn btn-outline btn-sm" data-edit-affair="${i}">编辑</button>
                <button class="btn btn-danger btn-sm" data-del-affair="${i}">删除</button>
              </td></tr>`).join("")}
          </tbody></table>
        </div>
      </div>
    </div>
    <div class="card"><div class="card-header"><h3>科室 · 事务承接一览</h3><span class="hint">按当前绑定自动生成</span></div>
      <div class="card-body" style="padding:0">
        <table><thead><tr><th style="width:200px">归口科室</th><th>承接事务</th></tr></thead>
        <tbody>
          ${MOCK.sections.map(d => `<tr><td>${d.name}</td>
            <td>${d.affairs.length ? d.affairs.map(a => `<span class="tag">${escapeHtml(a)}</span>`).join("") : '<span class="tag">—</span>'}</td></tr>`).join("")}
        </tbody></table>
      </div>
    </div>`;
  },

  showCatForm(idx) {
    const editing = idx >= 0;
    const c = editing ? MOCK.letterCategories[idx] : { label: "", color: "#3087CC" };
    const palette = ["#3087CC", "#006DAD", "#9CBFDA", "#1BB975", "#F29100", "#DF2027", "#9096A2", "#5AA9E6"];
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
      const color = colorInput.value.trim() || "#3087CC";
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
    const a = editing ? affairs[idx] : { name: "", dept: "" };
    this.showModal(editing ? "编辑事务分类" : "新增事务分类", `
      <div class="form-group"><label class="form-required">事务名称</label>
        <input id="aff-name" value="${escapeHtml(a.name)}" placeholder="如：宿舍管理" maxlength="12"></div>
      <div class="form-group"><label class="form-required">归口科室</label>
        <select id="aff-dept">
          <option value="">请选择科室</option>
          ${MOCK.sections.map(d => `<option ${d.name === a.dept ? "selected" : ""}>${d.name}</option>`).join("")}
        </select>
        <p class="form-hint" style="color:var(--text-muted)">绑定后，该事务的来信将自动归口至所选科室</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="aff-save">保存</button>
        <button class="btn btn-ghost" id="aff-cancel">取消</button>
      </div>`);
    const save = document.getElementById("aff-save");
    if (save) save.addEventListener("click", () => {
      const name = document.getElementById("aff-name").value.trim();
      const dept = document.getElementById("aff-dept").value;
      if (!name) { this.toast("请填写事务名称"); return; }
      if (!dept) { this.toast("请选择归口科室"); return; }
      const list = currentAffairs();
      if (list.some((x, i) => x.name === name && i !== idx)) { this.toast("该事务已存在"); return; }
      if (editing) list[idx] = { name, dept }; else list.push({ name, dept });
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
    const used = getAllLetters().filter(l => l.affair === a.name).length;
    if (used > 0) { this.toast(`已有 ${used} 封信件使用「${a.name}」，不能删除`); return; }
    affairs.splice(idx, 1);
    saveAffairs(affairs); this.toast("已删除"); this.render();
  },

  /* ---------- 科室管理（负责人 + 联系方式维护） ---------- */
  renderSectionMgr() {
    const secs = MOCK.sections;
    const usage = (name) => getAllLetters().filter(l => l.dept === name).length;
    this.afterRender = () => {
      const add = document.getElementById("btn-add-sec");
      if (add) add.addEventListener("click", () => this.showSectionForm(-1));
      document.querySelectorAll("[data-edit-sec]").forEach(b => b.addEventListener("click", () => this.showSectionForm(+b.dataset.editSec)));
      document.querySelectorAll("[data-del-sec]").forEach(b => b.addEventListener("click", () => this.delSection(+b.dataset.delSec)));
    };
    return `
    <p class="section-title">维护学工部各科室的负责人、联系方式与职责；负责人负责回复触达本科室的信件</p>
    <div class="card">
      <div class="card-header"><h3>科室通讯录与负责人</h3><button class="btn btn-primary btn-sm" id="btn-add-sec">＋ 新增科室</button></div>
      <div class="card-body" style="padding:0">
        <table><thead><tr>
          <th style="width:170px">科室名称</th><th style="width:80px">负责人</th><th style="width:130px">联系电话</th>
          <th style="width:170px">邮箱</th><th>承接事务</th><th style="width:60px">来信</th><th style="width:120px">操作</th>
        </tr></thead><tbody>
          ${secs.map((d, i) => `<tr>
            <td><strong>${escapeHtml(d.name)}</strong></td>
            <td>${escapeHtml(d.head || "-")}</td>
            <td class="mono">${escapeHtml(d.phone || "-")}</td>
            <td>${escapeHtml(d.email || "-")}</td>
            <td>${(d.affairs || []).length ? d.affairs.map(a => `<span class="tag">${escapeHtml(a)}</span>`).join("") : '<span class="tag">—</span>'}</td>
            <td>${usage(d.name)}</td>
            <td class="table-actions">
              <button class="btn btn-outline btn-sm" data-edit-sec="${i}">编辑</button>
              <button class="btn btn-danger btn-sm" data-del-sec="${i}">删除</button>
            </td></tr>`).join("")}
        </tbody></table>
      </div>
    </div>
    <p class="form-hint" style="color:var(--text-muted)">提示：科室的承接事务在「分类管理」中通过事务绑定维护；此处维护负责人与联系方式。</p>`;
  },

  showSectionForm(idx) {
    const editing = idx >= 0;
    const s = editing ? MOCK.sections[idx] : { name: "", head: "", phone: "", email: "", duty: "", affairs: [] };
    this.showModal(editing ? "编辑科室" : "新增科室", `
      <div class="form-row">
        <div class="form-group"><label class="form-required">科室名称</label>
          <input id="sec-name" value="${escapeHtml(s.name)}" placeholder="如：学生资助管理科" maxlength="20"></div>
        <div class="form-group"><label class="form-required">负责人</label>
          <input id="sec-head" value="${escapeHtml(s.head)}" placeholder="负责人姓名" maxlength="10"></div>
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
      const head = document.getElementById("sec-head").value.trim();
      const phone = document.getElementById("sec-phone").value.trim();
      const email = document.getElementById("sec-email").value.trim();
      const duty = document.getElementById("sec-duty").value.trim();
      if (!name) { this.toast("请填写科室名称"); return; }
      if (!head) { this.toast("请填写负责人"); return; }
      if (MOCK.sections.some((x, i) => x.name === name && i !== idx)) { this.toast("该科室已存在"); return; }
      const list = MOCK.sections.map(x => Object.assign({}, x));
      if (editing) {
        const old = list[idx].name;
        list[idx] = Object.assign(list[idx], { name, head, phone, email, duty });
        /* 科室改名时，同步事务绑定与已有信件的归口 */
        if (old !== name) {
          const affs = currentAffairs().map(a => a.dept === old ? { name: a.name, dept: name } : a);
          const letters = getLetters().map(l => { if (l.dept === old) l.dept = name; return l; });
          saveLetters(letters);
          MOCK.sections = list; saveAffairs(affs);
          this.hideModal(); this.toast("已保存"); this.render(); return;
        }
      } else {
        list.push({ name, head, phone, email, duty, affairs: [] });
      }
      saveSections(list);
      this.hideModal(); this.toast("已保存"); this.render();
    });
    const cancel = document.getElementById("sec-cancel");
    if (cancel) cancel.addEventListener("click", () => this.hideModal());
  },

  delSection(idx) {
    const s = MOCK.sections[idx];
    if (!s) return;
    const boundAffairs = (s.affairs || []).length;
    if (boundAffairs > 0) { this.toast(`「${s.name}」仍绑定 ${boundAffairs} 项事务，请先在分类管理中改绑`); return; }
    const used = getAllLetters().filter(l => l.dept === s.name).length;
    if (used > 0) { this.toast(`「${s.name}」已有 ${used} 封信件，不能删除`); return; }
    const list = MOCK.sections.slice(); list.splice(idx, 1);
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
            <td>${p.status === "现行有效" ? '<span class="tag" style="background:#1BB9751a;color:#1BB975">现行有效</span>' : '<span class="tag" style="background:#9096A21a;color:#9096A2">已废止</span>'}</td>
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

  /* ---------- 超期与催办配置（超期天数 + 催办模板 + 默认渠道） ---------- */
  renderSlaMgr() {
    const placeholders = ["{科室}", "{姓名}", "{事务分类}", "{标题}", "{编号}", "{来信时间}", "{已过天数}", "{催办时间}"];
    this.afterRender = () => {
      const save = document.getElementById("btn-save-sla");
      if (save) save.addEventListener("click", () => {
        const days = parseInt(document.getElementById("overdue-days").value, 10);
        if (!Number.isInteger(days) || days < 0 || days > 365) {
          this.toast("超期天数须为 0–365 之间的整数"); return;
        }
        const tpl = document.getElementById("urge-template").value.trim();
        if (!tpl) { this.toast("请填写催办消息模板"); return; }
        const ch = [...document.querySelectorAll(".channel-opts input:checked")].map(x => x.value);
        if (!ch.length) { this.toast("请至少选择一种默认发送渠道"); return; }
        saveOverdueConfig(days, tpl, ch);
        this.toast("超期与催办配置已保存，全部信件即时生效");
        this.render();
      });
    };
    return `
    <p class="section-title">统一设置「超期判定天数」与「催办消息模板 / 默认发送渠道」。保存后全部信件的超期标记与催办即时生效。</p>
    <div class="card">
      <div class="card-header"><h3>超期时限</h3><span class="hint">单一阈值 · 统一适用</span></div>
      <div class="card-body">
        <div class="form-group" style="max-width:420px">
          <label class="form-required">超过多少天未办结视为超期</label>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="number" min="0" max="365" id="overdue-days" value="${MOCK.overdueDays}" class="sla-input" style="width:120px">
            <span style="color:var(--text-soft)">天</span>
          </div>
          <p class="form-hint">办结时限 = 来信提交日 + 上述天数。当前：超过 <b>${MOCK.overdueDays}</b> 天仍未办结即标记「超期」。</p>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>催办消息模板</h3><span class="hint">发送催办时按模板自动填充</span></div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-required">催办消息模板</label>
          <textarea id="urge-template" rows="4" class="rating-comment" style="width:100%">${escapeHtml(MOCK.urgeTemplate)}</textarea>
          <p class="form-hint">可用占位符：${placeholders.map(p => `<code class="ph-chip">${p}</code>`).join(" ")}</p>
        </div>
        <div class="form-group">
          <label class="form-required">默认发送渠道</label>
          <div class="channel-opts">
            ${["sys", "its"].map(c => `<label class="channel-opt"><input type="checkbox" value="${c}" ${(MOCK.urgeChannels || []).includes(c) ? "checked" : ""}> ${CHANNEL_LABELS[c]}</label>`).join("")}
          </div>
          <p class="form-hint">学生催办、管理员督办与批量催办默认使用此渠道（发送时仍可临时调整）。</p>
        </div>
      </div>
    </div>
    <p class="form-hint" style="color:var(--text-muted)">提示：将超期天数改小（如设为 0）会立即让更多办理中信件进入「超期」状态，可在「督办催办」查看变化。</p>
    <div class="form-actions"><button class="btn btn-primary" id="btn-save-sla">保存配置</button></div>`;
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
            <td>${f.enabled !== false ? '<span class="badge" style="background:#1BB9751a;color:#1BB975">启用</span>' : '<span class="badge" style="background:#9096A21a;color:#9096A2">停用</span>'}</td>
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
      ctx.fillStyle = "#9096A2"; ctx.font = "12px sans-serif"; ctx.textAlign = "center"; ctx.fillText("暂无数据", cx, cy + 4);
      return;
    }
    let start = -Math.PI / 2;
    data.forEach(d => {
      const ang = d.value / total * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + ang); ctx.closePath();
      ctx.fillStyle = d.color || "#3087CC"; ctx.fill();
      start += ang;
    });
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.fillStyle = "#3C444F"; ctx.textAlign = "center";
    ctx.font = "bold 22px sans-serif"; ctx.fillText(total, cx, cy);
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#9096A2"; ctx.fillText("总计", cx, cy + 16);
  },

  drawBars(id, data) {
    const cv = document.getElementById(id);
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const w = cv.width, h = cv.height;
    const padL = 30, padB = 40, padT = 14, padR = 10;
    ctx.clearRect(0, 0, w, h);
    if (!data.length) { ctx.fillStyle = "#9096A2"; ctx.font = "12px sans-serif"; ctx.textAlign = "center"; ctx.fillText("暂无数据", w / 2, h / 2); return; }
    const max = Math.max(...data.map(d => d.value), 1);
    const chartH = h - padB - padT, chartW = w - padL - padR;
    const bw = chartW / data.length * 0.5;
    const gap = chartW / data.length;
    // 网格线
    ctx.strokeStyle = "#f1f5f9"; ctx.fillStyle = "#9096A2"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - chartH * i / 4;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.fillText(Math.round(max * i / 4), padL - 4, y + 3);
    }
    const colors = ["#3087CC", "#9CBFDA", "#1BB975", "#F29100", "#DF2027", "#006DAD"];
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


