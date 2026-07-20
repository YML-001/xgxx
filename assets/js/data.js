/* ============================================================
 * 学工信箱系统原型 —— 数据层
 * 仅面向「学生工作部（学工部）」，以内设科室为归口维度
 * 纯前端 mock 数据 + localStorage 工具函数
 * ============================================================ */

const STORE_KEYS = {
  role: "xg_role",             // student / section / admin
  section: "xg_section",       // 科室负责人当前所属科室
  mailbox: "xg_mailbox",
  letters: "xg_letters",       // 本地新增/修改的信件
  seedFlag: "xg_seeded_v5",
  config: "xg_config_v7",      // 分类/事务/科室/制度/超期时限/催办 配置（v7：新增催办模板与渠道）
  faq: "xg_faq_v1"            // 常见问题配置（管理员维护）
};

/* 催办发送渠道标签 */
const CHANNEL_LABELS = { sys: "系统消息", its: "ITS（校内系统/邮件）" };
const CHANNEL_SHORT = { sys: "系统消息", its: "ITS" };

/* 默认催办消息模板（占位符：{科室}{姓名}{事务分类}{标题}{编号}{来信时间}{已过天数}{催办时间}） */
const DEFAULT_URGE_TEMPLATE = "尊敬的{科室}：学生{姓名}就「{事务分类}·{标题}」（编号{编号}，来信{来信时间}）提交的信件已办理{已过天数}天仍未办结，现进行催办，请尽快处理并答复。—— {催办时间}";

const MOCK = {
  /* 当前登录用户（学生） */
  user: {
    name: "李诚",
    id: "8201230314",
    phone: "13874105021",
    email: "licheng@example.edu.cn",
    college: "计算机学院",
    avatar: "李"
  },

  /* 学工部管理员（可查看/回复/催办全部科室信件） */
  admin: {
    name: "王敏",
    role: "学工部 · 信箱管理员",
    avatar: "王"
  },

  /* 学工信箱（本系统仅此一个信箱） */
  mailbox: "学工信箱",
  mailboxes: ["学工信箱"],

  /* 一级信件分类 */
  letterCategories: [
    { label: "建议类", color: "#3087CC" },
    { label: "问题类", color: "#F29100" },
    { label: "咨询类", color: "#006DAD" },
    { label: "感谢类", color: "#1BB975" },
    { label: "投诉类", color: "#DF2027" }
  ],

  /* 二级事务分类（均属学工部职责范围） */
  affairCategories: [
    "思想教育", "党团组织",
    "学籍异动", "请假考勤", "违纪申诉",
    "奖助学金", "困难认定", "勤工助学",
    "心理咨询", "心理健康教育",
    "宿舍管理", "住宿调整",
    "就业指导", "生涯规划", "创业服务",
    "征兵入伍", "国防教育",
    "其他事务"
  ],

  /* 事务 → 归口科室 映射 */
  affairToSection: {
    "思想教育": "思想政治教育科",
    "党团组织": "思想政治教育科",
    "学籍异动": "学生日常管理科",
    "请假考勤": "学生日常管理科",
    "违纪申诉": "学生日常管理科",
    "奖助学金": "学生资助管理科",
    "困难认定": "学生资助管理科",
    "勤工助学": "学生资助管理科",
    "心理咨询": "心理健康教育中心",
    "心理健康教育": "心理健康教育中心",
    "宿舍管理": "学生公寓管理科",
    "住宿调整": "学生公寓管理科",
    "就业指导": "就业创业指导中心",
    "生涯规划": "就业创业指导中心",
    "创业服务": "就业创业指导中心",
    "征兵入伍": "征兵与国防教育办公室",
    "国防教育": "征兵与国防教育办公室",
    "其他事务": "综合办公室"
  },

  /* 学工部内设科室（含负责人与联系方式） */
  sections: [
    { name: "综合办公室", head: "王建国", phone: "0731-88830001", email: "zhb@xg.edu.cn", duty: "综合协调、信息宣传、信箱运行管理与其他综合事务", affairs: ["其他事务"] },
    { name: "思想政治教育科", head: "李国强", phone: "0731-88830002", email: "szjy@xg.edu.cn", duty: "学生思想政治教育、党团建设、主题教育与价值引领", affairs: ["思想教育", "党团组织"] },
    { name: "学生日常管理科", head: "张伟", phone: "0731-88830003", email: "rcgl@xg.edu.cn", duty: "学籍异动、请假考勤、违纪处理与申诉、日常事务管理", affairs: ["学籍异动", "请假考勤", "违纪申诉"] },
    { name: "学生资助管理科", head: "陈静", phone: "0731-88830004", email: "zz@xg.edu.cn", duty: "奖助学金评定、家庭经济困难认定、勤工助学管理", affairs: ["奖助学金", "困难认定", "勤工助学"] },
    { name: "心理健康教育中心", head: "刘芳", phone: "0731-88830005", email: "xl@xg.edu.cn", duty: "心理咨询预约、危机干预、心理健康教育与宣传", affairs: ["心理咨询", "心理健康教育"] },
    { name: "学生公寓管理科", head: "赵强", phone: "0731-88830006", email: "gy@xg.edu.cn", duty: "宿舍分配与调整、公寓秩序与住宿服务保障", affairs: ["宿舍管理", "住宿调整"] },
    { name: "就业创业指导中心", head: "孙丽", phone: "0731-88830007", email: "jy@xg.edu.cn", duty: "就业指导、生涯规划、创业帮扶与招聘服务", affairs: ["就业指导", "生涯规划", "创业服务"] },
    { name: "征兵与国防教育办公室", head: "周涛", phone: "0731-88830008", email: "zb@xg.edu.cn", duty: "大学生征兵入伍、国防教育与预备役工作", affairs: ["征兵入伍", "国防教育"] }
  ],

  /* 超期时限：超过 N 天未办结视为超期（默认 7 天） */
  overdueDays: 7,

  /* 催办消息模板与默认发送渠道（可在「超期与催办配置」中修改） */
  urgeTemplate: DEFAULT_URGE_TEMPLATE,
  urgeChannels: ["sys"],

  /* 催办通知记录（原型 mock，运行期内存） */
  notifications: [],

  /* 满意度评价快捷标签（多选） */
  ratingTags: ["办理及时", "态度热情", "结果满意", "流程清晰", "答复专业"],

  /* 受理范围 */
  acceptScope: {
    accept: [
      "对学工部教育、管理、服务等方面的意见与建议",
      "学习、生活中遇到的困难与合理求助（资助、住宿、心理等）",
      "学工部各科室职责、政策、办事流程的咨询",
      "对学工部职责范围内事项的投诉与反映"
    ],
    reject: [
      "非学工部职责范围内的事项（如教务、后勤、网络等）",
      "涉及 110、119、120 等紧急救助的事项",
      "涉及国家机密、个人隐私及违反公序良俗的事项",
      "应通过诉讼、仲裁、纪检监察等法定程序解决的事项",
      "已依法依规办结，仍以同一事实重复提出的事项"
    ]
  },

  /* 制度/规范性文件（学工部）
   * body：正文富文本（HTML，可空，为空时详情页回退到 policySummary 生成的摘要）
   * attachments：附件文件名数组（可空） */
  policies: [
    {
      code: "学工〔2026〕7号", title: "关于印发《学生诉求接诉即办工作实施办法》的通知", cat: "综合管理", status: "现行有效", date: "2026-06-18",
      body: `<p>各学院、学工部各科室：</p><p>为深入推进学生诉求「接诉即办」工作，切实提升为学生服务的质量与效率，经研究，现将《学生诉求接诉即办工作实施办法》印发给你们，请结合实际认真贯彻执行。</p><p><strong>一、总体要求</strong></p><p>坚持以学生为中心，健全「受理—分派—办理—反馈—回访」闭环机制，做到诉求件件有着落、事事有回音。</p><p><strong>二、办理时限</strong></p><p>来信自提交之日起，超过规定天数仍未办结的，系统自动标记为「超期」，并纳入管理员督办范围。具体超期天数由管理员在「超期时限配置」中统一设定。</p><p><strong>三、工作要求</strong></p><p>各归口科室要落实首问负责制，加强跟踪督办与满意度回访，确保学生诉求及时、规范、妥善处理。本办法自印发之日起施行。</p>`,
      attachments: [{ name: "《学生诉求接诉即办工作实施办法》全文.pdf", size: 1887436, type: "application/pdf" }, { name: "接诉即办工作流程图.png", size: 430080, type: "image/png" }]
    },
    {
      code: "学工〔2026〕5号", title: "关于修订《本科生奖助学金评定管理办法》的通知", cat: "学生资助", status: "现行有效", date: "2026-05-20",
      body: `<p>各学院：</p><p>根据上级有关文件精神，结合我校学生资助工作实际，学校对《本科生奖助学金评定管理办法》进行了修订，现予印发，请认真组织学习并贯彻落实。</p><p><strong>一、修订要点</strong></p><ul><li>优化家庭经济困难认定与学业表现的权重结构，向困难且学业进步明显的学生倾斜；</li><li>各学院名额分配方案须于评定前 5 个工作日在学院范围内公示；</li><li>健全评定回避、异议申诉与结果公示机制，保障评定公开、公平、公正。</li></ul><p><strong>二、执行时间</strong></p><p>本办法自 2026 年秋季学期起执行，原《本科生奖助学金评定管理办法》同时废止。</p>`,
      attachments: [{ name: "《本科生奖助学金评定管理办法》(2026修订).pdf", size: 1258291, type: "application/pdf" }, { name: "奖助学金评定政策解读.docx", size: 364544, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }]
    },
    { code: "学工〔2026〕3号", title: "关于印发《学生宿舍管理与调整办法》的通知", cat: "日常管理", status: "现行有效", date: "2026-04-12" },
    { code: "学工〔2026〕1号", title: "关于加强学生心理健康教育工作的实施意见", cat: "心理健康", status: "现行有效", date: "2026-02-28" },
    { code: "学工〔2025〕18号", title: "关于印发《学生违纪处分与申诉处理办法》的通知", cat: "日常管理", status: "现行有效", date: "2025-12-10" },
    { code: "学工〔2025〕12号", title: "关于加强和改进学生思想政治教育工作的意见", cat: "思想教育", status: "现行有效", date: "2025-09-15" },
    { code: "学工〔2025〕6号", title: "关于印发《大学生征兵入伍激励办法》的通知", cat: "征兵国防", status: "现行有效", date: "2025-05-06" },
    { code: "学工〔2024〕9号", title: "关于印发《学生就业创业指导服务办法》的通知", cat: "就业创业", status: "已废止", date: "2024-06-01" }
  ],

  policyCats: ["综合管理", "思想教育", "日常管理", "学生资助", "心理健康", "就业创业", "征兵国防"],

  /* 常见问题（可由管理员在「常见问题配置」中维护，学生端按 enabled + order 展示） */
  faqs: [
    { id: "faq1", q: "写信后多久能收到回复？", a: "信件提交后由归口科室受理办理。系统按统一的超期天数判定是否超期：超过设定天数仍未办结的信件会自动标记为「超期」，并纳入管理员督办；具体天数以管理员在「超期时限配置」中的设定为准。", category: "办理流程", order: 1, enabled: true },
    { id: "faq2", q: "我的信件会由谁办理？", a: "系统会按事务类型自动匹配并分派至对应归口科室，由该科室负责人受理、核实办理并答复；管理员（系统管理）仅对特殊信件进行转办，并负责督办催办。", category: "办理流程", order: 2, enabled: true },
    { id: "faq3", q: "如何查看我的信件办理进度？", a: "登录后进入「我的信件」，或在「信件查询」中输入信件编号，即可查看受理、办理、答复的完整流程时间轴。", category: "使用指南", order: 3, enabled: true },
    { id: "faq4", q: "对办理结果不满意怎么办？", a: "在信件详情中对答复进行满意度评价；若不满意可点击「申请二次办理」，信件将重新进入办理流程。", category: "办理流程", order: 4, enabled: true },
    { id: "faq5", q: "信件长时间没有回复怎么办？", a: "可在信件详情点击「催办」，系统会向归口科室推送催办提醒；超过时限未办结的信件也会自动触发管理员督办。", category: "办理流程", order: 5, enabled: true },
    { id: "faq6", q: "哪些事项不予受理？", a: "非学工部职责范围（如教务、后勤、网络等）、涉及紧急救助（110/119/120）、涉及国家机密或个人隐私、应通过法定程序解决，以及重复无理诉求等事项不予受理。", category: "受理范围", order: 6, enabled: true }
  ]
};

/* 办理流程模板（按事务类型自动匹配归口科室，无需管理员人工受理分派） */
const PROCESS_TEMPLATE = [
  { step: "提交来信", actor: "来信人", note: "来信人通过学工信箱提交诉求，系统按事务类型自动匹配至{dept}" },
  { step: "科室受理办理", actor: "{dept}", note: "{dept}负责人受理并开展核实与办理" },
  { step: "答复反馈", actor: "{dept}", note: "办理完成，向来信人反馈处理结果" }
];

/* ---------------- localStorage 工具 ---------------- */
function getRole() { return localStorage.getItem(STORE_KEYS.role) || "student"; }
function saveRole(r) { localStorage.setItem(STORE_KEYS.role, r); }

/* 科室负责人当前所属科室 */
function getSection() {
  const s = localStorage.getItem(STORE_KEYS.section);
  if (s && MOCK.sections.some(x => x.name === s)) return s;
  return MOCK.sections[0].name;
}
function saveSection(s) { localStorage.setItem(STORE_KEYS.section, s); }

function getMailbox() { return MOCK.mailbox; }
function saveMailbox(m) { localStorage.setItem(STORE_KEYS.mailbox, m); }

function getLetters() {
  try { return JSON.parse(localStorage.getItem(STORE_KEYS.letters)) || []; }
  catch (e) { return []; }
}
function saveLetters(list) { localStorage.setItem(STORE_KEYS.letters, JSON.stringify(list)); }

/* 学生本人信件（来信人 = 当前用户，含草稿） */
function getMyLetters() {
  return getLetters().filter(l => l.owner === "me");
}

/* 全部信件（办理端视角） */
function getAllLetters() {
  return getLetters().filter(l => l.status !== "草稿");
}

/* 某科室承接的信件 */
function getSectionLetters(section) {
  return getAllLetters().filter(l => l.dept === section);
}

function getLetterById(id) {
  return getLetters().find(l => l.id === id);
}

function upsertLetter(letter) {
  const list = getLetters();
  const idx = list.findIndex(l => l.id === letter.id);
  if (idx >= 0) list[idx] = letter; else list.unshift(letter);
  saveLetters(list);
}

function getDraft(mailbox) {
  return getMyLetters().find(l => l.status === "草稿");
}

/* ---------------- 配置管理（分类/事务/科室/制度） ---------------- */
/* 持久化结构：{ letterCategories, affairs:[{name,dept}], sections, policies } */
function loadConfig() {
  let cfg;
  try { cfg = JSON.parse(localStorage.getItem(STORE_KEYS.config)); } catch (e) { cfg = null; }
  if (cfg && cfg.letterCategories && cfg.affairs && cfg.sections) {
    MOCK.letterCategories = cfg.letterCategories;
    MOCK.sections = cfg.sections;
    if (cfg.policies) MOCK.policies = cfg.policies;
    if (typeof cfg.overdueDays === "number" && cfg.overdueDays >= 0) {
      MOCK.overdueDays = cfg.overdueDays;
    } /* 忽略旧版 slaRules，沿用默认 overdueDays */
    if (typeof cfg.urgeTemplate === "string" && cfg.urgeTemplate.trim()) MOCK.urgeTemplate = cfg.urgeTemplate;
    if (Array.isArray(cfg.urgeChannels) && cfg.urgeChannels.length) MOCK.urgeChannels = cfg.urgeChannels;
    applyAffairs(cfg.affairs);
  } else {
    saveConfig();
  }
}

function currentAffairs() {
  return MOCK.affairCategories.map(name => ({ name, dept: MOCK.affairToSection[name] || "" }));
}

function applyAffairs(affairs) {
  MOCK.affairCategories = affairs.map(a => a.name);
  MOCK.affairToSection = {};
  affairs.forEach(a => { MOCK.affairToSection[a.name] = a.dept; });
  syncSectionAffairs();
}

/* 根据 affairToSection 重建各科室承接事务列表 */
function syncSectionAffairs() {
  MOCK.sections.forEach(d => { d.affairs = []; });
  Object.entries(MOCK.affairToSection).forEach(([affair, secName]) => {
    const d = MOCK.sections.find(x => x.name === secName);
    if (d && !d.affairs.includes(affair)) d.affairs.push(affair);
  });
}

function saveConfig() {
  const cfg = {
    letterCategories: MOCK.letterCategories,
    affairs: currentAffairs(),
    sections: MOCK.sections,
    policies: MOCK.policies,
    overdueDays: MOCK.overdueDays,
    urgeTemplate: MOCK.urgeTemplate,
    urgeChannels: MOCK.urgeChannels
  };
  localStorage.setItem(STORE_KEYS.config, JSON.stringify(cfg));
}

function saveCategories(list) { MOCK.letterCategories = list; saveConfig(); }
function saveAffairs(list) { applyAffairs(list); saveConfig(); }
function saveSections(list) { MOCK.sections = list; syncSectionAffairs(); saveConfig(); }
function savePolicies(list) { MOCK.policies = list; saveConfig(); }
function saveOverdueDays(n) { MOCK.overdueDays = n; saveConfig(); }

/* ---------------- 常见问题配置（管理员维护 → 学生端展示） ---------------- */
/* 读取 FAQ 配置：优先本地存储，缺失/损坏时回退到默认 MOCK.faqs */
function loadFaqs() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEYS.faq));
    if (Array.isArray(raw) && raw.length) { MOCK.faqs = raw; return raw; }
  } catch (e) {}
  return MOCK.faqs;
}
/* 持久化 FAQ 配置（并同步内存），order 按数组顺序归一 */
function saveFaqs(list) {
  const normalized = list.map((f, i) => Object.assign({}, f, { order: i + 1 }));
  MOCK.faqs = normalized;
  localStorage.setItem(STORE_KEYS.faq, JSON.stringify(normalized));
}
/* 学生端展示用：仅启用项，按 order 升序 */
function faqsForDisplay() {
  return loadFaqs().filter(f => f.enabled !== false)
    .slice().sort((a, b) => (a.order || 0) - (b.order || 0));
}
/* 生成 FAQ 唯一 id */
function genFaqId() { return "faq" + Date.now().toString(36) + Math.floor(Math.random() * 90 + 10); }
/* 合并保存「超期与催办配置」：超期天数 + 催办模板 + 默认渠道 */
function saveOverdueConfig(days, template, channels) {
  MOCK.overdueDays = days;
  MOCK.urgeTemplate = template;
  MOCK.urgeChannels = (channels && channels.length) ? channels : ["sys"];
  saveConfig();
}

/* ---------------- 通用工具 ---------------- */
function pad(n) { return String(n).padStart(2, "0"); }

function formatDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function formatDateTime(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${formatDate(dt)} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function genLetterId() {
  const d = new Date();
  const rnd = Math.floor(Math.random() * 900 + 100);
  return `XG${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${rnd}`;
}

/* ---------------- 线性图标（Hugeicons 风格，替代 emoji 界面图标） ----------------
 * 24×24 viewBox，stroke=currentColor；随容器 font-size 缩放（width:1em）。 */
const ICON_PATHS = {
  home: '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.8V20h12V9.8"/>',
  write: '<path d="M12.5 20H20"/><path d="M15.5 4.5a2 2 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  megaphone: '<path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1z"/><path d="M16 9a4.5 4.5 0 0 1 0 6"/>',
  doc: '<path d="M6 2.5h7l5 5V21.5H6z"/><path d="M13 2.5V8h5"/><path d="M9 13h6M9 16.5h6"/>',
  chart: '<path d="M3.5 20h17"/><rect x="5" y="11" width="3.2" height="6" rx=".6"/><rect x="10.4" y="6.5" width="3.2" height="10.5" rx=".6"/><rect x="15.8" y="13.5" width="3.2" height="3.5" rx=".6"/>',
  phone: '<path d="M5 4h3l1.6 4.2-2 1.4a11 11 0 0 0 4.8 4.8l1.4-2L18 16v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 3 6.2 2 2 0 0 1 5 4z"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.2a2.4 2.4 0 1 1 3.3 2.2c-.8.4-1.1.9-1.1 1.8"/><path d="M12 16.6h.01"/>',
  dashboard: '<rect x="3.5" y="3.5" width="7" height="8.5" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.2"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.2"/><rect x="3.5" y="15.5" width="7" height="5" rx="1.2"/>',
  inbox: '<path d="M4 13.5h4l1.4 2.6h5.2L16 13.5h4"/><path d="M4.5 13.5 6.5 5h11l2 8.5v6.5h-15z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
  trend: '<path d="M3.5 16.5 9.5 10.5l3.5 3.5 7-7"/><path d="M15.5 7h4.5v4.5"/>',
  tags: '<path d="M4 4.5h8L20 12l-8 8-8-8z"/><circle cx="8.3" cy="8.3" r="1.3"/>',
  building: '<rect x="5" y="3.5" width="14" height="17" rx="1"/><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M10.5 20.5v-3h3v3"/>',
  book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v14H6.5A1.5 1.5 0 0 0 5 18.5z"/><path d="M5 18.5V21h14v-4"/><path d="M8.5 7h7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M16 5.3a3.2 3.2 0 0 1 0 6"/><path d="M17.5 19.5a5.5 5.5 0 0 0-3-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  paperclip: '<path d="M20 11.5 12 19.5a4.2 4.2 0 0 1-6-6l8.5-8.5a2.8 2.8 0 0 1 4 4L10 17a1.4 1.4 0 0 1-2-2l7-7"/>',
  sparkles: '<path d="M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7z"/><path d="M18.6 15.4l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z"/>',
  eye: '<path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"/><circle cx="12" cy="12" r="2.7"/>',
  check: '<path d="M4 12.5l5 5 11-11"/>',
  up: '<path d="M6 14l6-6 6 6"/>',
  down: '<path d="M6 10l6 6 6-6"/>',
  file: '<path d="M6 2.5h8l4 4V21.5H6z"/><path d="M14 2.5V6.5h4"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.7"/><path d="m4 17.5 4.5-4.5 3.5 3.5L16 12l4 4"/>'
};
function svgIcon(name) {
  const p = ICON_PATHS[name];
  if (!p) return "";
  return `<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:inline-block;vertical-align:-0.14em">${p}</svg>`;
}

/* 去除 HTML 标签，返回纯文本（用于计数、校验、搜索） */
function stripHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim();
}

/* 将信件内容渲染为安全展示 HTML：已是富文本则保留，纯文本则转义并换行 */
function contentHtml(str) {
  if (!str) return "";
  if (/<(p|br|div|ul|ol|li|b|strong|i|em|u|s|strike|del|font|span|a|h[1-6]|blockquote|hr)\b/i.test(str)) return str;
  return escapeHtml(str).replace(/\n/g, "<br>");
}

/* 信件正文摘要：纯文本、折叠空白、超长截断加省略号（空/草稿内容返回空串，调用处跳过） */
function contentExcerpt(content, max) {
  const text = stripHtml(content).replace(/\s+/g, " ").trim();
  if (!text) return "";
  const n = max || 60;
  return text.length > n ? text.slice(0, n) + "…" : text;
}

/* ---------------- 附件工具（兼容旧字符串文件名与新 {name,size,type} 对象） ---------------- */
function attachName(a) { return typeof a === "string" ? a : ((a && a.name) || ""); }
function attachSize(a) { return (a && typeof a === "object" && +a.size) ? +a.size : 0; }
function attachType(a) { return (a && typeof a === "object" && a.type) ? a.type : ""; }
function attachExt(a) { const n = attachName(a); const i = n.lastIndexOf("."); return i >= 0 ? n.slice(i + 1).toLowerCase() : ""; }
function attachMeta(a) { return { name: attachName(a), size: attachSize(a), type: attachType(a) }; }

function formatFileSize(bytes) {
  bytes = +bytes || 0;
  if (bytes <= 0) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1).replace(/\.0$/, "") + " KB";
  return (bytes / 1048576).toFixed(1).replace(/\.0$/, "") + " MB";
}

const IMG_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];
function isImageAttach(a) {
  if (a && typeof a === "object" && a.type && a.type.indexOf("image/") === 0) return true;
  return IMG_EXTS.includes(attachExt(a));
}
const FILE_TYPE_LABELS = {
  pdf: "PDF 文档", doc: "Word 文档", docx: "Word 文档", ppt: "PPT 演示", pptx: "PPT 演示",
  xls: "Excel 表格", xlsx: "Excel 表格", txt: "文本文件", zip: "压缩包", rar: "压缩包",
  png: "图片", jpg: "图片", jpeg: "图片", gif: "图片", webp: "图片", bmp: "图片", svg: "图片"
};
function fileTypeLabel(a) { return FILE_TYPE_LABELS[attachExt(a)] || "文件"; }
function fileIcon(a) {
  if (isImageAttach(a)) return "image";
  if (["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"].includes(attachExt(a))) return "doc";
  return "file";
}

/* 详情页附件展示 chips（可点击预览，携带 name/size/type 数据属性） */
function attachChipsHtml(items, cls) {
  if (!items || !items.length) return "";
  return items.map(a => {
    const size = formatFileSize(attachSize(a));
    return `<span class="${cls} att-chip" data-att-name="${escapeHtml(attachName(a))}" data-att-size="${attachSize(a)}" data-att-type="${escapeHtml(attachType(a))}" style="cursor:pointer">${svgIcon(fileIcon(a))} ${escapeHtml(attachName(a))}${size ? " · " + size : ""}</span>`;
  }).join("");
}

/* ---------------- 补充材料（学生提交 → 办理端可见，闭环） ---------------- */
function genSupplementId() {
  return "SUP" + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100);
}

/* 追加一条补充材料到信件（不改变状态，仅记录） */
function addSupplement(letter, text, attachments) {
  if (!letter.supplements) letter.supplements = [];
  letter.supplements.push({
    id: genSupplementId(),
    at: formatDateTime(new Date()),
    by: "student",
    text: text || "",
    attachments: attachments || []
  });
  return letter;
}

/* 补充材料列表 HTML（详情/办理端共用；chipCls 决定附件 chip 样式：tag / m-tag） */
function supplementItemsHtml(letter, chipCls) {
  const sups = (letter && letter.supplements) || [];
  if (!sups.length) return "";
  return sups.map((s, i) => {
    const text = s.text ? `<div class="sup-text">${escapeHtml(s.text).replace(/\n/g, "<br>")}</div>` : "";
    const atts = (s.attachments && s.attachments.length)
      ? `<div class="sup-atts">${attachChipsHtml(s.attachments, chipCls)}</div>` : "";
    return `<div class="sup-item">
      <div class="sup-head"><span class="sup-idx">补充材料 ${i + 1}</span><span class="sup-time">${escapeHtml(s.at || "")}</span></div>
      ${text}${atts}
    </div>`;
  }).join("");
}

/* ---------------- 催办（催办通知 + 模板 + 记录，闭环） ---------------- */
function genReminderId() {
  return "RM" + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100);
}

/* 距来信提交已过天数（用于模板占位符 {已过天数}） */
function daysSinceCreated(letter) {
  if (!letter || !letter.createdAt) return 0;
  const ms = Date.now() - new Date(letter.createdAt).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

/* 用信件数据填充催办模板占位符 */
function fillUrgeTemplate(letter, template) {
  const tpl = template || MOCK.urgeTemplate || DEFAULT_URGE_TEMPLATE;
  const map = {
    "{科室}": letter.dept || "归口科室",
    "{姓名}": letter.name || "来信人",
    "{事务分类}": letter.affair || "",
    "{标题}": letter.title || "",
    "{编号}": letter.id || "",
    "{来信时间}": letter.date || (letter.createdAt ? letter.createdAt.slice(0, 10) : ""),
    "{已过天数}": String(daysSinceCreated(letter)),
    "{催办时间}": formatDateTime(new Date())
  };
  return tpl.replace(/\{科室\}|\{姓名\}|\{事务分类\}|\{标题\}|\{编号\}|\{来信时间\}|\{已过天数\}|\{催办时间\}/g, k => map[k]);
}

/* 渠道数组 → 中文短标签串（如「系统消息、ITS」） */
function channelLabel(channels) {
  return (channels || []).map(c => CHANNEL_SHORT[c] || c).join("、");
}

/* 发送催办：填充模板 → 记录到 letter.reminders[] 与 MOCK.notifications[] → 置 urged 标记 */
function sendUrge(letter, channels, by) {
  const ch = (channels && channels.length) ? channels : (MOCK.urgeChannels || ["sys"]);
  const text = fillUrgeTemplate(letter);
  const rec = {
    id: genReminderId(),
    at: formatDateTime(new Date()),
    by: by || "student",
    channel: ch.slice(),
    text: text,
    sectionId: letter.dept || ""
  };
  if (!letter.reminders) letter.reminders = [];
  letter.reminders.push(rec);
  letter.urged = true;
  letter.urgedAt = rec.at;
  if (!MOCK.notifications) MOCK.notifications = [];
  MOCK.notifications.push(Object.assign({ letterId: letter.id }, rec));
  return rec;
}

/* 催办记录列表 HTML（详情/办理端共用） */
function reminderItemsHtml(letter) {
  const rms = (letter && letter.reminders) || [];
  if (!rms.length) return "";
  const byLabel = { student: "来信人", admin: "管理员", section: "科室" };
  return rms.map((r, i) => `<div class="urge-item">
      <div class="urge-head">
        <span class="urge-idx">催办 ${i + 1}</span>
        <span class="urge-ch">${(r.channel || []).map(c => `<span class="urge-chip">${CHANNEL_SHORT[c] || c}</span>`).join("")}</span>
        <span class="urge-time">${escapeHtml(r.at || "")} · ${byLabel[r.by] || r.by || ""}</span>
      </div>
      <div class="urge-text">${escapeHtml(r.text || "")}</div>
    </div>`).join("");
}

/* ---------------- 富文本工具栏（桌面/移动共用；仅按钮 class 不同） ---------------- */
function rtToolbarHtml(btn) {
  const b = (cmd, label, title, val) => `<button type="button" class="${btn}" data-cmd="${cmd}"${val ? ` data-value="${val}"` : ""} title="${title}">${label}</button>`;
  const sw = (cmd, color, title, hl) => `<button type="button" class="rt-swatch${hl ? " rt-hl" : ""}" data-cmd="${cmd}" data-value="${color}" title="${title}" style="background:${color}"></button>`;
  const fore = [["#3087CC", "主蓝"], ["#1BB975", "成功绿"], ["#F29100", "警告橙"], ["#DF2027", "危险红"], ["#3C444F", "墨黑"]];
  const hl = [["#E3F1F9", "蓝底"], ["#E8FCF4", "绿底"], ["#FFF5E5", "橙底"], ["#FCE8EA", "红底"], ["#FFF3B0", "黄底"]];
  return [
    b("formatBlock", "标题", "小标题（H3）", "h3"),
    b("formatBlock", "小标题", "次级标题（H4）", "h4"),
    b("formatBlock", "正文", "恢复为正文段落", "p"),
    `<span class="rt-sep"></span>`,
    b("bold", "<b>B</b>", "加粗"),
    b("italic", "<i>I</i>", "斜体"),
    b("underline", "<u>U</u>", "下划线"),
    b("strikeThrough", "<s>S</s>", "删除线"),
    `<span class="rt-sep"></span>`,
    b("insertUnorderedList", "• 列表", "无序列表"),
    b("insertOrderedList", "1. 列表", "有序列表"),
    b("formatBlock", "引用", "引用块", "blockquote"),
    b("insertHorizontalRule", "分隔线", "插入分隔线"),
    `<span class="rt-sep"></span>`,
    b("justifyLeft", "左", "左对齐"),
    b("justifyCenter", "中", "居中对齐"),
    b("justifyRight", "右", "右对齐"),
    `<span class="rt-sep"></span>`,
    `<span class="rt-cap" title="文字颜色">A</span>`,
    fore.map(c => sw("foreColor", c[0], "文字·" + c[1])).join(""),
    `<span class="rt-cap rt-cap-hl" title="文字高亮">A</span>`,
    hl.map(c => sw("hiliteColor", c[0], "高亮·" + c[1], true)).join(""),
    `<span class="rt-sep"></span>`,
    b("removeFormat", "清除", "清除格式")
  ].join("");
}

/* 工具栏绑定：mousedown+preventDefault 保持选区，execCommand 执行（含颜色 data-value） */
function bindRt(toolbar, editor, after) {
  if (!toolbar || !editor) return;
  toolbar.querySelectorAll("[data-cmd]").forEach(btn => btn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    editor.focus();
    try { document.execCommand(btn.dataset.cmd, false, btn.dataset.value || null); } catch (err) {}
    if (after) after();
  }));
}

/* ---------------- 真实附件上传（纯前端，无后端） ---------------- */
/* File → 附件对象；图片生成 objectURL 供缩略图/预览（仅本次会话有效，不持久化 blob） */
function filesToAttachments(fileList) {
  return Array.from(fileList || []).map(f => ({
    name: f.name, size: f.size, type: f.type || "",
    url: (f.type && f.type.indexOf("image/") === 0) ? URL.createObjectURL(f) : ""
  }));
}

/* 上传列表项 HTML（桌面/移动共用 up-* 样式：缩略图/文件名/大小/进度/删除） */
function uploaderItemsHtml(items) {
  if (!items || !items.length) return "";
  return items.map((a, i) => {
    const thumb = (isImageAttach(a) && a.url)
      ? `<span class="up-thumb" style="background-image:url('${a.url}')"></span>`
      : `<span class="up-thumb up-thumb-ico">${svgIcon(fileIcon(a))}</span>`;
    const size = formatFileSize(attachSize(a));
    return `<div class="up-item" data-att-idx="${i}">
      ${thumb}
      <div class="up-meta">
        <div class="up-name" title="${escapeHtml(attachName(a))}">${escapeHtml(attachName(a))}</div>
        <div class="up-sub">${escapeHtml(fileTypeLabel(a))}${size ? " · " + size : ""}</div>
        <div class="up-progress"><span></span></div>
      </div>
      <button type="button" class="up-del" data-del-att="${i}" title="移除附件" aria-label="移除附件">&times;</button>
    </div>`;
  }).join("");
}

/* 通用上传器：真实 <input type=file> + 拖拽 + 缩略图 + 删除 + 点击预览。返回 { seed, getMeta } */
function makeUploader(zone, input, list, onPreview) {
  let items = [];
  const render = () => {
    if (!list) return;
    list.innerHTML = uploaderItemsHtml(items);
    list.querySelectorAll("[data-del-att]").forEach(btn => btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const i = +btn.dataset.delAtt, a = items[i];
      if (a && a.url) { try { URL.revokeObjectURL(a.url); } catch (err) {} }
      items.splice(i, 1); render();
    }));
    list.querySelectorAll(".up-item").forEach(el => el.addEventListener("click", () => {
      const a = items[+el.dataset.attIdx]; if (a && onPreview) onPreview(a);
    }));
  };
  const add = (fileList) => {
    const arr = filesToAttachments(fileList);
    if (arr.length) { items = items.concat(arr); render(); }
  };
  if (input) input.addEventListener("change", () => { add(input.files); input.value = ""; });
  if (zone) {
    zone.addEventListener("click", () => input && input.click());
    ["dragenter", "dragover"].forEach(ev => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add("dragover"); }));
    ["dragleave", "dragend"].forEach(ev => zone.addEventListener(ev, () => zone.classList.remove("dragover")));
    zone.addEventListener("drop", (e) => { e.preventDefault(); zone.classList.remove("dragover"); add(e.dataTransfer && e.dataTransfer.files); });
  }
  return {
    seed: (arr) => { items = (arr || []).map(a => typeof a === "string" ? { name: a, size: 0, type: "" } : Object.assign({}, a)); render(); },
    getMeta: () => items.map(a => attachMeta(a))
  };
}

/* 由标题与类别合成一段合理的制度文件说明（原型无正文，用于详情展示） */
function policySummary(p) {
  if (!p) return "";
  const m = (p.title || "").match(/《([^》]+)》/);
  const docName = m ? m[1] : "";
  const effective = p.status === "现行有效";
  const nameClause = docName ? `《${escapeHtml(docName)}》` : "该文件";
  return `${nameClause}是学生工作部围绕「${escapeHtml(p.cat)}」工作制定发布的规范性文件，于 ${escapeHtml(p.date)} 印发施行。`
    + `文件结合我校学生工作实际，对相关工作的适用范围、职责分工、办理流程、工作标准与保障措施等作出明确规定，`
    + `是学工部及各内设科室开展${escapeHtml(p.cat)}相关工作、规范办理学生诉求的重要依据。`
    + (effective
        ? "目前该文件现行有效，请各归口科室遵照执行。"
        : "该文件现已废止，相关事项请参照现行有效的最新规定执行。");
}

/* 按统一超期天数计算办结时限（createdAt + overdueDays） */
function calcDeadline(createdAt) {
  const days = Number.isFinite(MOCK.overdueDays) ? MOCK.overdueDays : 7;
  const d = new Date(createdAt);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/* 生成办理流程时间轴 */
function buildProcessLog(letter) {
  const dept = MOCK.affairToSection[letter.affair] || letter.dept || "归口科室";
  const start = new Date(letter.createdAt);
  const stageCount = { "待受理": 1, "办理中": 2, "已办结": 3, "已撤回": 1 }[letter.status] || 1;
  const log = [];
  for (let i = 0; i < PROCESS_TEMPLATE.length && i < stageCount; i++) {
    const s = PROCESS_TEMPLATE[i];
    const t = new Date(start.getTime() + i * 5 * 3600000);
    log.push({
      step: s.step,
      time: formatDateTime(t),
      actor: s.actor.replace("{dept}", dept),
      note: s.note.replace("{dept}", dept),
      done: true
    });
  }
  /* 在「提交来信」之后按录入顺序插入补充材料节点 */
  const sups = letter.supplements || [];
  if (sups.length && log.length) {
    const supNodes = sups.map(s => {
      const cnt = (s.attachments && s.attachments.length) || 0;
      let note = s.text ? (s.text.length > 42 ? s.text.slice(0, 42) + "…" : s.text) : "";
      if (cnt) note += (note ? " " : "") + `（含 ${cnt} 个附件）`;
      return { step: "补充材料", time: s.at || "", actor: "来信人", note: escapeHtml(note || "提交补充材料"), done: true };
    });
    log.splice(1, 0, ...supNodes);
  }
  return log;
}

/* 多条件过滤 */
function filterLetters(letters, f) {
  f = f || {};
  return letters.filter(l => {
    if (f.mailbox && l.mailbox !== f.mailbox) return false;
    if (f.section && l.dept !== f.section) return false;
    if (f.status && l.status !== f.status) return false;
    if (f.category && l.category !== f.category) return false;
    if (f.affair && l.affair !== f.affair) return false;
    if (f.title && !(l.title || "").includes(f.title)) return false;
    if (f.content && !(l.content || "").includes(f.content)) return false;
    if (f.dept && !(l.dept || "").includes(f.dept)) return false;
    if (f.start && l.date < f.start) return false;
    if (f.end && l.date > f.end) return false;
    return true;
  });
}

function statusColor(status) {
  return {
    "草稿": "#9096A2",
    "办理中": "#3087CC",
    "已办结": "#1BB975",
    "已撤回": "#9096A2"
  }[status] || "#9096A2";
}

/* 是否超期未办结 */
/* 依据当前 overdueDays 动态计算办结时限（配置变更后即时生效） */
function effectiveDeadline(letter) {
  if (!letter) return "";
  if (!letter.createdAt) return letter.deadline || "";
  return calcDeadline(letter.createdAt);
}

function isOverdue(letter) {
  if (letter.status === "已办结" || letter.status === "已撤回") return false;
  const dl = effectiveDeadline(letter);
  if (!dl) return false;
  return formatDate(new Date()) > dl;
}

/* ---------------- 时间分桶（统计分析：年度 / 季度 / 月度） ---------------- */
function letterDateStr(l) { return (l && (l.date || (l.createdAt ? l.createdAt.slice(0, 10) : ""))) || ""; }

function bucketKey(l, gran) {
  const d = letterDateStr(l);
  if (!d) return "";
  const y = d.slice(0, 4), m = +d.slice(5, 7) || 0;
  if (gran === "year") return y;
  if (gran === "quarter") return `${y} Q${Math.ceil(m / 3) || 1}`;
  return `${y}-${pad(m)}`;
}

/* 汇总为 [{label, value}] 并按时间升序排列（仅含出现过的区间） */
function bucketCounts(letters, gran) {
  const map = {};
  letters.forEach(l => { const k = bucketKey(l, gran); if (k) map[k] = (map[k] || 0) + 1; });
  return Object.keys(map).sort().map(k => ({ label: k, value: map[k] }));
}

/* ---------------- 预置 mock 信件 ---------------- */
function seedLetters() {
  if (localStorage.getItem(STORE_KEYS.seedFlag)) return;

  const M = "学工信箱";
  const seed = [
    /* ---- 学生本人来信 ---- */
    {
      id: "XG20260612118", mailbox: M, owner: "me",
      title: "关于国家励志奖学金评定名额分配的建议", category: "建议类", affair: "奖助学金",
      name: "李诚", idInfo: "8201230314", phone: "13874105021", email: "licheng@example.edu.cn",
      unit: "计算机学院", address: "杏林校区A栋", isPublic: "yes",
      content: "建议在国家励志奖学金评定中，进一步向家庭经济困难且学业进步明显的同学倾斜，并提前公示各学院名额分配方案，让评定更公开透明。",
      status: "已办结", level: "重要", dept: "学生资助管理科", createdAt: "2026-06-12T09:10:00", date: "2026-06-12",
      deadline: "2026-06-15", urged: false, reopened: false,
      reply: { dept: "学生资助管理科", time: "2026-06-14 16:20", content: "感谢您的建议。本年度评定已细化困难认定与学业进步权重，各学院名额分配方案将在评定前 5 个工作日公示，欢迎持续监督。" },
      rating: 5, ratingTags: ["办理及时", "流程清晰", "结果满意"], ratingComment: "科室答复很快，名额分配方案也提前公示了，感谢学工部的用心。", ratedAt: "2026-06-15", attachments: []
    },
    {
      id: "XG20260701203", mailbox: M, owner: "me",
      title: "关于申请调整宿舍床位的进度咨询", category: "问题类", affair: "住宿调整",
      name: "李诚", idInfo: "8201230314", phone: "13874105021", email: "licheng@example.edu.cn",
      unit: "计算机学院", address: "杏林校区A栋315", isPublic: "no",
      content: "本人两周前提交了宿舍床位调整申请（因作息差异影响休息），至今未收到结果，恳请公寓管理科告知办理进度，谢谢。",
      status: "办理中", level: "一般", dept: "学生公寓管理科", createdAt: "2026-07-01T20:30:00", date: "2026-07-01",
      deadline: "2026-07-02", urged: true, reopened: false,
      reply: null, rating: null, attachments: [{ name: "调整申请表.jpg", size: 251904, type: "image/jpeg" }]
    },
    {
      id: "XG20260714077", mailbox: M, owner: "me",
      title: "关于预约心理咨询服务的咨询", category: "咨询类", affair: "心理咨询",
      name: "李诚", idInfo: "8201230314", phone: "13874105021", email: "licheng@example.edu.cn",
      unit: "计算机学院", address: "", isPublic: "no",
      content: "老师您好，近期学业压力较大、睡眠不佳，想预约一次心理咨询，请问预约方式、地点、时间安排以及是否保密？谢谢。",
      status: "办理中", level: "一般", dept: "心理健康教育中心", createdAt: "2026-07-14T10:05:00", date: "2026-07-14",
      deadline: "2026-07-15", urged: false, reopened: false,
      reply: null, rating: null, attachments: []
    },

    /* ---- 其他同学来信（办理端可见、部分公开） ---- */
    {
      id: "XG20260610091", mailbox: M, owner: "other",
      title: "感谢辅导员在主题教育活动中的悉心指导", category: "感谢类", affair: "思想教育",
      name: "张*", idInfo: "保密", phone: "137****8890", email: "",
      unit: "材料学院", address: "", isPublic: "yes",
      content: "在本次「青春心向党」主题教育活动中，辅导员老师全程耐心指导，让我对理想信念有了更深理解，特此感谢学工部的用心组织！",
      status: "已办结", level: "一般", dept: "思想政治教育科", createdAt: "2026-06-10T14:00:00", date: "2026-06-10",
      deadline: "2026-06-11", urged: false, reopened: false,
      reply: { dept: "思想政治教育科", time: "2026-06-10 18:30", content: "感谢同学的肯定！我们将持续打造更多有温度、有深度的主题教育活动，欢迎积极参与。" },
      rating: 5, ratingTags: ["态度热情", "结果满意"], ratingComment: "辅导员老师非常用心，活动很有意义，为学工部点赞！", ratedAt: "2026-06-11", attachments: []
    },
    {
      id: "XG20260628140", mailbox: M, owner: "other",
      title: "关于优化线上请假审批流程的建议", category: "建议类", affair: "请假考勤",
      name: "王*", idInfo: "保密", phone: "150****2231", email: "",
      unit: "商学院", address: "", isPublic: "yes",
      content: "目前线上请假需层层审批、耗时较长，建议增加审批进度提醒与超时自动催办，并支持一键撤回，提升同学请假体验。",
      status: "已办结", level: "重要", dept: "学生日常管理科", createdAt: "2026-06-28T11:00:00", date: "2026-06-28",
      deadline: "2026-07-01", urged: false, reopened: false,
      reply: { dept: "学生日常管理科", time: "2026-06-30 15:10", content: "感谢建议。请假系统已上线审批进度提醒与超时催办功能，撤回功能正在测试，预计下月开放。" },
      rating: 4, ratingTags: ["办理及时", "答复专业"], ratingComment: "建议被采纳并很快上线，希望撤回功能也早日开放。", ratedAt: "2026-07-01", attachments: []
    },
    {
      id: "XG20260706166", mailbox: M, owner: "other",
      title: "关于勤工助学岗位工资发放延迟的问题反映", category: "问题类", affair: "勤工助学",
      name: "刘*", idInfo: "保密", phone: "182****5567", email: "",
      unit: "电信学院", address: "", isPublic: "no",
      content: "本人担任图书馆勤工助学岗位，上月工资至今未发放，影响生活开支，希望资助管理科核实处理，谢谢。",
      status: "办理中", level: "重要", dept: "学生资助管理科", createdAt: "2026-07-06T21:15:00", date: "2026-07-06",
      deadline: "2026-07-09", urged: false, reopened: false,
      reply: null, rating: null, attachments: []
    },
    {
      id: "XG20260709188", mailbox: M, owner: "other",
      title: "关于增加校园招聘专场与生涯规划讲座的建议", category: "建议类", affair: "就业指导",
      name: "陈*", idInfo: "保密", phone: "199****1120", email: "",
      unit: "自动化学院", address: "", isPublic: "yes",
      content: "临近秋招，建议就业中心增加行业招聘专场与简历、面试等生涯规划讲座，并提前公布日程，帮助同学更好准备。",
      status: "办理中", level: "一般", dept: "就业创业指导中心", createdAt: "2026-07-09T19:40:00", date: "2026-07-09",
      deadline: "2026-07-10", urged: false, reopened: false,
      reply: null, rating: null, attachments: []
    },
    {
      id: "XG20260703155", mailbox: M, owner: "other",
      title: "关于加强大学生征兵入伍政策宣传的建议", category: "建议类", affair: "征兵入伍",
      name: "赵*", idInfo: "保密", phone: "138****7742", email: "",
      unit: "机械学院", address: "", isPublic: "yes",
      content: "建议在征兵季通过讲座、学长分享、政策解读等形式加强宣传，并对退役复学、学费补偿等政策做集中答疑，鼓励更多同学应征入伍。",
      status: "已办结", level: "重要", dept: "征兵与国防教育办公室", createdAt: "2026-07-03T09:30:00", date: "2026-07-03",
      deadline: "2026-07-06", urged: false, reopened: false,
      reply: { dept: "征兵与国防教育办公室", time: "2026-07-06 10:00", content: "感谢建议。我们已安排 3 场征兵政策宣讲与退役学长分享会，并设立一站式咨询窗口，相关政策已在学工部网站集中发布。" },
      rating: 5, attachments: []
    },
    {
      id: "XG20260630120", mailbox: M, owner: "other",
      title: "关于宿舍晚归违纪处理结果的申诉", category: "投诉类", affair: "违纪申诉",
      name: "孙*", idInfo: "保密", phone: "158****3390", email: "",
      unit: "外国语学院", address: "", isPublic: "no",
      content: "本人因参加学校批准的社团活动晚归被记违纪，认为处理有误，已附活动审批材料，恳请学生日常管理科复核撤销，谢谢。",
      status: "办理中", level: "疑难", dept: "学生日常管理科", createdAt: "2026-06-30T22:10:00", date: "2026-06-30",
      deadline: "2026-07-07", urged: true, reopened: false,
      reply: null, rating: null, attachments: [{ name: "活动审批表.pdf", size: 542720, type: "application/pdf" }]
    },
    {
      id: "XG20260620133", mailbox: M, owner: "other",
      title: "关于家庭经济困难认定材料的咨询", category: "咨询类", affair: "困难认定",
      name: "周*", idInfo: "保密", phone: "136****6654", email: "",
      unit: "生命科学学院", address: "", isPublic: "yes",
      content: "老师您好，想咨询本年度家庭经济困难学生认定需要提交哪些材料、如何线上申报以及认定档次的划分标准，谢谢。",
      status: "已办结", level: "一般", dept: "学生资助管理科", createdAt: "2026-06-20T10:20:00", date: "2026-06-20",
      deadline: "2026-06-21", urged: false, reopened: false,
      reply: { dept: "学生资助管理科", time: "2026-06-21 09:15", content: "您好，困难认定实行线上申报，需填写《家庭经济情况调查表》并上传相关佐证材料，认定分为特殊困难、困难、一般困难三档，详见资助中心通知。" },
      rating: 4, attachments: []
    },
    {
      id: "XG20260702101", mailbox: M, owner: "other",
      title: "关于学工信箱办理流程的咨询", category: "咨询类", affair: "其他事务",
      name: "吴*", idInfo: "保密", phone: "133****2214", email: "",
      unit: "法学院", address: "", isPublic: "yes",
      content: "请问在学工信箱提交诉求后，一般由哪个科室办理、如何查询进度？是否可以匿名提交？谢谢。",
      status: "办理中", level: "一般", dept: "综合办公室", createdAt: "2026-07-02T15:30:00", date: "2026-07-02",
      deadline: "2026-07-03", urged: false, reopened: false,
      reply: null, rating: null, attachments: []
    },

    /* ---- 历史来信（跨年度 / 季度 / 月度，支撑统计分析时间维度） ---- */
    {
      id: "XG20240415061", mailbox: M, owner: "other",
      title: "关于增设春季线上双选会的建议", category: "建议类", affair: "就业指导",
      name: "郑*", idInfo: "保密", phone: "135****3021", email: "",
      unit: "商学院", address: "", isPublic: "yes",
      content: "临近春招，建议就业中心增设线上双选会与行业招聘专场，方便同学求职。",
      status: "已办结", level: "重要", dept: "就业创业指导中心", createdAt: "2024-04-15T10:00:00", date: "2024-04-15",
      deadline: "2024-04-18", urged: false, reopened: false,
      reply: { dept: "就业创业指导中心", time: "2024-04-18 15:00", content: "感谢建议，已增设春季线上双选会与行业专场，相关安排已在就业网发布。" },
      rating: 5, ratingTags: ["办理及时", "结果满意", "答复专业"], ratingComment: "春招前就安排了专场招聘，非常及时，帮助很大！", ratedAt: "2024-04-19", attachments: []
    },
    {
      id: "XG20240520074", mailbox: M, owner: "other",
      title: "关于家庭经济困难认定材料的咨询", category: "咨询类", affair: "困难认定",
      name: "冯*", idInfo: "保密", phone: "139****7745", email: "",
      unit: "生命科学学院", address: "", isPublic: "yes",
      content: "想咨询家庭经济困难认定的申报材料与流程，谢谢老师。",
      status: "已办结", level: "一般", dept: "学生资助管理科", createdAt: "2024-05-20T09:20:00", date: "2024-05-20",
      deadline: "2024-05-21", urged: false, reopened: false,
      reply: { dept: "学生资助管理科", time: "2024-05-21 10:30", content: "困难认定采取线上申报，需提交家庭情况调查表及佐证材料，详见资助中心通知。" },
      rating: 4, attachments: []
    },
    {
      id: "XG20241012088", mailbox: M, owner: "other",
      title: "关于宿舍楼公共区域照明损坏的问题反映", category: "问题类", affair: "宿舍管理",
      name: "蒋*", idInfo: "保密", phone: "137****2290", email: "",
      unit: "机械学院", address: "", isPublic: "no",
      content: "宿舍楼公共区域照明损坏多日，晚间出行不便，恳请公寓管理科尽快维修。",
      status: "已办结", level: "重要", dept: "学生公寓管理科", createdAt: "2024-10-12T21:00:00", date: "2024-10-12",
      deadline: "2024-10-15", urged: false, reopened: false,
      reply: { dept: "学生公寓管理科", time: "2024-10-15 09:40", content: "已联系维修班组更换宿舍公共区域照明，并排查同楼层线路，感谢反映。" },
      rating: 4, ratingTags: ["办理及时", "态度热情"], ratingComment: "报修后两天就修好了，师傅态度也很好。", ratedAt: "2024-10-16", attachments: []
    },
    {
      id: "XG20241108095", mailbox: M, owner: "other",
      title: "感谢心理中心老师的耐心疏导", category: "感谢类", affair: "心理咨询",
      name: "韩*", idInfo: "保密", phone: "158****6612", email: "",
      unit: "外国语学院", address: "", isPublic: "yes",
      content: "感谢心理中心老师的耐心疏导，让我走出了一段情绪低谷，非常感激。",
      status: "已办结", level: "一般", dept: "心理健康教育中心", createdAt: "2024-11-08T14:30:00", date: "2024-11-08",
      deadline: "2024-11-09", urged: false, reopened: false,
      reply: { dept: "心理健康教育中心", time: "2024-11-08 18:00", content: "感谢同学的信任与肯定，我们会继续为大家提供温暖专业的心理支持。" },
      rating: 5, attachments: []
    },
    {
      id: "XG20250218102", mailbox: M, owner: "other",
      title: "关于请假销假环节增加到期提醒的建议", category: "建议类", affair: "请假考勤",
      name: "邓*", idInfo: "保密", phone: "133****4418", email: "",
      unit: "法学院", address: "", isPublic: "yes",
      content: "建议在请假销假环节增加到期提醒，避免同学忘记销假影响考勤。",
      status: "已办结", level: "一般", dept: "学生日常管理科", createdAt: "2025-02-18T11:10:00", date: "2025-02-18",
      deadline: "2025-02-19", urged: false, reopened: false,
      reply: { dept: "学生日常管理科", time: "2025-02-19 16:00", content: "感谢建议，请假小程序已支持销假提醒，后续将持续优化审批体验。" },
      rating: 4, attachments: []
    },
    {
      id: "XG20250325116", mailbox: M, owner: "other",
      title: "关于上半年征兵报名与复学政策的咨询", category: "咨询类", affair: "征兵入伍",
      name: "曹*", idInfo: "保密", phone: "199****3327", email: "",
      unit: "自动化学院", address: "", isPublic: "yes",
      content: "想咨询今年上半年征兵报名时间、退役复学及学费补偿的相关政策，谢谢。",
      status: "已办结", level: "一般", dept: "征兵与国防教育办公室", createdAt: "2025-03-25T10:40:00", date: "2025-03-25",
      deadline: "2025-03-26", urged: false, reopened: false,
      reply: { dept: "征兵与国防教育办公室", time: "2025-03-26 11:00", content: "上半年征兵报名已开放，退役复学与学费补偿政策详见学工部专栏，欢迎到办公室咨询。" },
      rating: 5, ratingTags: ["答复专业", "流程清晰"], ratingComment: "老师把入伍和复学政策讲得很清楚，解答很专业。", ratedAt: "2025-03-27", attachments: []
    },
    {
      id: "XG20250514128", mailbox: M, owner: "other",
      title: "关于勤工助学工资发放时间的问题反映", category: "问题类", affair: "勤工助学",
      name: "彭*", idInfo: "保密", phone: "182****9908", email: "",
      unit: "电信学院", address: "", isPublic: "no",
      content: "上月勤工助学工资发放较晚，希望能明确固定的发放时间。",
      status: "已办结", level: "重要", dept: "学生资助管理科", createdAt: "2025-05-14T20:10:00", date: "2025-05-14",
      deadline: "2025-05-17", urged: false, reopened: false,
      reply: { dept: "学生资助管理科", time: "2025-05-19 09:30", content: "经核实系报账周期延后，本月工资已补发到账，后续将优化发放流程。" },
      rating: 3, attachments: []
    },
    {
      id: "XG20250709139", mailbox: M, owner: "other",
      title: "关于增加实践类主题教育项目的建议", category: "建议类", affair: "思想教育",
      name: "萧*", idInfo: "保密", phone: "150****1145", email: "",
      unit: "材料学院", address: "", isPublic: "yes",
      content: "建议增加实践类主题教育项目，让思政教育更生动、更贴近同学。",
      status: "已办结", level: "一般", dept: "思想政治教育科", createdAt: "2025-07-09T09:00:00", date: "2025-07-09",
      deadline: "2025-07-10", urged: false, reopened: false,
      reply: { dept: "思想政治教育科", time: "2025-07-10 15:20", content: "感谢建议，暑期将推出“行走的思政课”实践项目，欢迎报名参与。" },
      rating: 5, ratingTags: ["结果满意", "态度热情", "流程清晰"], ratingComment: "主题教育形式越来越丰富，实践项目很有意义。", ratedAt: "2025-07-11", attachments: []
    },
    {
      id: "XG20250922147", mailbox: M, owner: "other",
      title: "关于宿舍调换审批进度的咨询", category: "问题类", affair: "住宿调整",
      name: "袁*", idInfo: "保密", phone: "137****5560", email: "",
      unit: "计算机学院", address: "", isPublic: "no",
      content: "因作息差异申请调换宿舍，提交申请后想了解当前审批进度。",
      status: "办理中", level: "一般", dept: "学生公寓管理科", createdAt: "2025-09-22T19:30:00", date: "2025-09-22",
      deadline: "2025-09-23", urged: false, reopened: false,
      reply: null, rating: null, attachments: []
    },
    {
      id: "XG20251130158", mailbox: M, owner: "other",
      title: "感谢就业中心老师的悉心指导", category: "感谢类", affair: "就业指导",
      name: "于*", idInfo: "保密", phone: "135****7781", email: "",
      unit: "商学院", address: "", isPublic: "yes",
      content: "在就业中心老师帮助下顺利拿到心仪 offer，特此感谢一路以来的指导！",
      status: "已办结", level: "一般", dept: "就业创业指导中心", createdAt: "2025-11-30T16:00:00", date: "2025-11-30",
      deadline: "2025-12-01", urged: false, reopened: false,
      reply: { dept: "就业创业指导中心", time: "2025-11-30 18:30", content: "恭喜同学顺利签约！祝前程似锦，欢迎常回校分享经验。" },
      rating: 5, attachments: []
    },
    {
      id: "XG20260115167", mailbox: M, owner: "other",
      title: "关于国家奖学金评审结果公示的咨询", category: "咨询类", affair: "奖助学金",
      name: "苏*", idInfo: "保密", phone: "139****2213", email: "",
      unit: "生命科学学院", address: "", isPublic: "yes",
      content: "想咨询本学年国家奖学金评审结果的公示时间与异议反馈渠道。",
      status: "已办结", level: "一般", dept: "学生资助管理科", createdAt: "2026-01-15T10:15:00", date: "2026-01-15",
      deadline: "2026-01-16", urged: false, reopened: false,
      reply: { dept: "学生资助管理科", time: "2026-01-16 09:50", content: "国家奖学金评审结果已公示，如有异议可在公示期内向资助中心反映。" },
      rating: 4, ratingTags: ["流程清晰", "结果满意"], ratingComment: "评审结果公示很及时，流程也比较透明。", ratedAt: "2026-01-17", attachments: []
    },
    {
      id: "XG20260220175", mailbox: M, owner: "other",
      title: "关于开学季开展团体心理辅导的建议", category: "建议类", affair: "心理健康教育",
      name: "卢*", idInfo: "保密", phone: "158****4432", email: "",
      unit: "外国语学院", address: "", isPublic: "yes",
      content: "建议开学季多开展一些团体心理辅导和减压活动，帮助同学适应新学期。",
      status: "已办结", level: "一般", dept: "心理健康教育中心", createdAt: "2026-02-20T14:20:00", date: "2026-02-20",
      deadline: "2026-02-21", urged: false, reopened: false,
      reply: { dept: "心理健康教育中心", time: "2026-02-21 10:10", content: "感谢建议，新学期将开设团体辅导与减压工作坊，具体安排会在公众号发布。" },
      rating: 5, attachments: []
    },
    {
      id: "XG20260311182", mailbox: M, owner: "other",
      title: "关于考勤违纪认定的申诉", category: "投诉类", affair: "违纪申诉",
      name: "潘*", idInfo: "保密", phone: "133****6690", email: "",
      unit: "机械学院", address: "", isPublic: "no",
      content: "对本次考勤违纪认定有异议，已附情况说明，恳请日常管理科复核处理。",
      status: "办理中", level: "疑难", dept: "学生日常管理科", createdAt: "2026-03-11T22:00:00", date: "2026-03-11",
      deadline: "2026-03-18", urged: true, reopened: false,
      reply: null, rating: null, attachments: [{ name: "情况说明.pdf", size: 486400, type: "application/pdf" }]
    }
  ];

  saveLetters(seed);
  localStorage.setItem(STORE_KEYS.seedFlag, "1");
}

seedLetters();
loadConfig();
loadFaqs();
