/* ============================================================
 * 学工信箱系统原型 —— 数据层
 * 仅面向「学生工作部（学工部）」，以内设科室为归口维度
 * 纯前端 mock 数据 + localStorage 工具函数
 * ============================================================ */

const STORE_KEYS = {
  role: "xg_role",             // student / admin / leader / replier / college
  section: "xg_section",       // 科室领导、回复人当前所属科室
  member: "xg_member",         // 回复人当前身份（科室成员 id）
  college: "xg_college",       // 学院副书记当前所属学院
  mailbox: "xg_mailbox",
  letters: "xg_letters",       // 本地新增/修改的信件
  msgs: "xg_msgs",             // 消息通知（M-01 ~ M-24）
  seedFlag: "xg_seeded_v9",
  config: "xg_config_v9",      // 分类/事务/科室+成员/学院/制度/时限/模板 配置
  faq: "xg_faq_v3"            // 常见问题配置（管理员维护）
};

/* 学生可见状态：提交后为「待分派」，综合办分给科室领导后为「办理中」，回复人确认发送后为「已办结」 */
const STATUS = {
  draft: "草稿",
  pending: "待分派",
  doing: "办理中",
  done: "已办结",
  withdrawn: "已撤回"
};

/* 办理端当前环节（学生端只看 STATUS，办理端按环节流转） */
const STAGE = {
  pending: "待分派",
  needReplier: "待指定回复人",
  replying: "回复中",
  collab: "学院协同中",
  approving: "待审批",
  rejected: "已打回",
  confirm: "待确认发送",
  done: "已办结",
  withdrawn: "已撤回"
};

/* 身份标签 */
const ROLE_LABELS = { student: "学生", admin: "综合办", leader: "科室领导", replier: "科室回复人", college: "学院副书记" };

/* 公开范围：由回复人在确认发送时选择 */
const PUBLIC_SCOPE = { all: "全部公开", college: "仅该学院副书记可见" };

/* 催办发送渠道标签 */
const CHANNEL_LABELS = { sys: "系统消息", its: "ITS（校内系统/邮件）" };
const CHANNEL_SHORT = { sys: "系统消息", its: "ITS" };

/* 默认催办 / 督办模板（M-15 / M-16 共用） */
const DEFAULT_URGE_TEMPLATE = "尊敬的{当前办理人}：学生{姓名}就「{事务分类}·{标题}」（编号{编号}，来信{来信时间}）提交的信件已办理{已过天数}天仍未办结，现进行催办，请尽快处理。—— {催办时间}";

/* 默认收悉回执模板（M-01） */
const DEFAULT_ACK_TEMPLATE = "尊敬的{姓名}同学：\n您好！您于{来信时间}通过学工信箱提交的来信「{标题}」（编号{编号}）我们已经收到，感谢您的反馈。\n综合办公室将进行受理，并流转至相关科室办理。我们将在{承诺天数}天内给予您正式回复，请留意「我的信件」中的办理进度。\n本消息仅表示来信已收悉，正式办理结果将另行答复。\n学工部综合办公室\n{回执时间}";

/* 消息模板（建设方案 M-01 ~ M-24；M-12、M-14 已取消）。M-01 与 M-15/M-16 可在「时限与模板」中修改 */
const MSG_TEMPLATES = {
  "M-01": { name: "提交回执", channel: ["sys", "its"], text: DEFAULT_ACK_TEMPLATE },
  "M-02": { name: "正式答复提醒", channel: ["sys", "its"], text: "尊敬的{姓名}同学：\n您提交的来信「{标题}」（编号{编号}）已办理完成。请登录学工信箱，在「我的信件」中查看正式答复，并作出评价。\n学工部综合办公室\n{答复时间}" },
  "M-03": { name: "新来信待分派", channel: ["sys", "its"], text: "综合办公室：收到一封新的学生来信待分派。学生{姓名}（{所在单位}）就「{事务分类}·{标题}」（编号{编号}）于{来信时间}提交，请及时指定科室领导。" },
  "M-04": { name: "分给科室领导", channel: ["sys", "its"], text: "{科室领导}：综合办公室将学生{姓名}的来信「{事务分类}·{标题}」（编号{编号}，来信{来信时间}）分至{承办科室}，请指定回复人。分派说明：{分派说明}。" },
  "M-05": { name: "改派科室", channel: ["sys", "its"], text: "{科室领导}：学生来信「{标题}」（编号{编号}）已由综合办公室于{分派时间}改派至{承办科室}，原科室为{原承办科室}。请指定回复人。改派说明：{分派说明}。" },
  "M-06": { name: "指定回复人", channel: ["sys", "its"], text: "{回复人}：您有一封学生来信待办理。学生{姓名}就「{事务分类}·{标题}」（编号{编号}，来信{来信时间}）由{科室领导}指定您回复，办结时限{办结时限}。请登录学工信箱拟写答复。" },
  "M-07": { name: "改派回复人", channel: ["sys", "its"], text: "{回复人}：学生来信「{标题}」（编号{编号}）已改由您回复，原回复人为{原回复人}。办结时限{办结时限}。请及时接手。" },
  "M-08": { name: "待审批", channel: ["sys", "its"], text: "{科室领导}：{回复人}已提交「{标题}」（编号{编号}）的答复，请审批。所有信件均须审批后，才能由回复人确认发给学生。" },
  "M-09": { name: "审批通过", channel: ["sys", "its"], text: "{回复人}：您提交的「{标题}」（编号{编号}）已由科室领导审批通过。请登录学工信箱确认发送。确认前不会发给学生。" },
  "M-10": { name: "审批打回", channel: ["sys", "its"], text: "{回复人}：您提交的「{标题}」（编号{编号}）未通过审批。修改意见：{审批意见}。请按意见修改后再次提交审批。通过前请勿回复学生。" },
  "M-11": { name: "请学院协同", channel: ["sys", "its"], text: "{副书记}：科室回复人{回复人}就学生{姓名}（{所在单位}）的来信「{标题}」（编号{编号}）请学院协同。请指定人员线下承办；承办完成后请写处理意见，并发回科室回复人。" },
  "M-13": { name: "学院处理意见发回", channel: ["sys", "its"], text: "{回复人}：学院副书记已就「{标题}」（编号{编号}）写明处理意见：{处理意见}。请据此编辑正式答复，再提交科室领导审批。" },
  "M-15": { name: "学生催办", channel: ["sys", "its"], text: DEFAULT_URGE_TEMPLATE },
  "M-16": { name: "综合办督办", channel: ["sys", "its"], text: DEFAULT_URGE_TEMPLATE },
  "M-17": { name: "超期未分派", channel: ["sys", "its"], text: "综合办公室：「{标题}」（编号{编号}，来信{来信时间}）已{已过天数}天仍未分给科室领导，请尽快分派。—— {提醒时间}" },
  "M-18": { name: "待指定回复人", channel: ["sys", "its"], text: "{科室领导}：「{标题}」（编号{编号}）已分至{承办科室}，尚未指定回复人，距办结时限还剩{剩余天数}天，请尽快指定。—— {提醒时间}" },
  "M-19": { name: "临近超期", channel: ["sys", "its"], text: "{回复人}：您负责的「{标题}」（编号{编号}）距办结时限{办结时限}还剩{剩余天数}天，请尽快拟写答复并提交审批。—— {提醒时间}" },
  "M-20": { name: "已经超期", channel: ["sys", "its"], text: "【超期提醒】「{事务分类}·{标题}」（编号{编号}，来信{来信时间}）已超出办结时限{超期天数}天仍未办结。当前办理人：{当前办理人}。请立即处理。—— {提醒时间}" },
  "M-21": { name: "补充材料", channel: ["sys"], text: "{当前办理人}：学生{姓名}对「{标题}」（编号{编号}）于{提交时间}提交了补充材料，请登录学工信箱查看。" },
  "M-22": { name: "二次办理", channel: ["sys", "its"], text: "{回复人}：学生{姓名}对「{标题}」（编号{编号}）的办理结果不满意，已于{发起时间}申请二次办理。请重新核实并提交审批，新办结时限{办结时限}。" },
  "M-23": { name: "撤回来信", channel: ["sys"], text: "{当前办理人}：学生{姓名}已于{撤回时间}撤回「{标题}」（编号{编号}），该信件无需继续办理。" },
  "M-24": { name: "满意度评价", channel: ["sys"], text: "{回复人}：学生{姓名}对「{标题}」（编号{编号}）作出评价：{评分}星。{评价内容}　—— {评价时间}" }
};

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

  /* 综合办管理员（统一受理全部来信，分给科室领导） */
  admin: {
    name: "王敏",
    role: "综合办公室 · 信箱管理员",
    avatar: "王",
    section: "综合办公室"
  },

  /* 统一受理科室：学生来信先到这里，再由其管理员派发 */
  intakeSection: "综合办公室",

  /* 学工信箱（本系统仅此一个信箱） */
  mailbox: "学工信箱",
  mailboxes: ["学工信箱"],

  /* 一级信件分类 */
  letterCategories: [
    { label: "建议类", color: "#2A8DC7" },
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

  /* 学工部内设科室（含负责人、联系方式与科室成员）
   * duty：职责说明，展示在科室联系方式中。分派不按事务匹配科室，由综合办人工指定。
   * members：科室成员；leader 为科室领导（科长），每科室一名，负责指定回复人并审批答复；
   *   其余在用成员为回复人候选 */
  sections: [
    {
      name: "综合办公室", head: "王建国", phone: "0731-88830001", email: "zhb@xg.edu.cn",
      duty: "综合协调、信息宣传、信箱运行管理与其他综合事务",
      members: [
        { id: "M101", leader: true, name: "王建国", title: "科长", phone: "0731-88830001", email: "wangjg@xg.edu.cn", enabled: true },
        { id: "M102", name: "王敏", title: "信箱管理员", phone: "0731-88830011", email: "wangmin@xg.edu.cn", enabled: true },
        { id: "M103", name: "刘洋", title: "综合干事", phone: "0731-88830012", email: "liuyang@xg.edu.cn", enabled: true }
      ]
    },
    {
      name: "思想政治教育科", head: "李国强", phone: "0731-88830002", email: "szjy@xg.edu.cn",
      duty: "学生思想政治教育、党团建设、主题教育与价值引领",
      members: [
        { id: "M201", leader: true, name: "李国强", title: "科长", phone: "0731-88830002", email: "ligq@xg.edu.cn", enabled: true },
        { id: "M202", name: "陈昊", title: "思政干事", phone: "0731-88830021", email: "chenhao@xg.edu.cn", enabled: true },
        { id: "M203", name: "唐蕊", title: "团委干事", phone: "0731-88830022", email: "tangrui@xg.edu.cn", enabled: true }
      ]
    },
    {
      name: "学生日常管理科", head: "张伟", phone: "0731-88830003", email: "rcgl@xg.edu.cn",
      duty: "学籍异动、请假考勤、违纪处理与申诉、日常事务管理",
      members: [
        { id: "M301", leader: true, name: "张伟", title: "科长", phone: "0731-88830003", email: "zhangwei@xg.edu.cn", enabled: true },
        { id: "M302", name: "何静", title: "学籍管理员", phone: "0731-88830031", email: "hejing@xg.edu.cn", enabled: true },
        { id: "M303", name: "郭鹏", title: "纪检干事", phone: "0731-88830032", email: "guopeng@xg.edu.cn", enabled: true }
      ]
    },
    {
      name: "学生资助管理科", head: "陈静", phone: "0731-88830004", email: "zz@xg.edu.cn",
      duty: "奖助学金评定、家庭经济困难认定、勤工助学管理",
      members: [
        { id: "M401", leader: true, name: "陈静", title: "科长", phone: "0731-88830004", email: "chenjing@xg.edu.cn", enabled: true },
        { id: "M402", name: "邱敏", title: "资助干事", phone: "0731-88830041", email: "qiumin@xg.edu.cn", enabled: true },
        { id: "M403", name: "冯磊", title: "勤工助学管理员", phone: "0731-88830042", email: "fenglei@xg.edu.cn", enabled: true }
      ]
    },
    {
      name: "心理健康教育中心", head: "刘芳", phone: "0731-88830005", email: "xl@xg.edu.cn",
      duty: "心理咨询预约、危机干预、心理健康教育与宣传",
      members: [
        { id: "M501", leader: true, name: "刘芳", title: "中心主任", phone: "0731-88830005", email: "liufang@xg.edu.cn", enabled: true },
        { id: "M502", name: "沈悦", title: "心理咨询师", phone: "0731-88830051", email: "shenyue@xg.edu.cn", enabled: true },
        { id: "M503", name: "罗晨", title: "心理咨询师", phone: "0731-88830052", email: "luochen@xg.edu.cn", enabled: true }
      ]
    },
    {
      name: "学生公寓管理科", head: "赵强", phone: "0731-88830006", email: "gy@xg.edu.cn",
      duty: "宿舍分配与调整、公寓秩序与住宿服务保障",
      members: [
        { id: "M601", leader: true, name: "赵强", title: "科长", phone: "0731-88830006", email: "zhaoqiang@xg.edu.cn", enabled: true },
        { id: "M602", name: "蒋磊", title: "公寓管理员", phone: "0731-88830061", email: "jianglei@xg.edu.cn", enabled: true }
      ]
    },
    {
      name: "就业创业指导中心", head: "孙丽", phone: "0731-88830007", email: "jy@xg.edu.cn",
      duty: "就业指导、生涯规划、创业帮扶与招聘服务",
      members: [
        { id: "M701", leader: true, name: "孙丽", title: "中心主任", phone: "0731-88830007", email: "sunli@xg.edu.cn", enabled: true },
        { id: "M702", name: "谢婷", title: "就业指导师", phone: "0731-88830071", email: "xieting@xg.edu.cn", enabled: true },
        { id: "M703", name: "韩宇", title: "创业帮扶专员", phone: "0731-88830072", email: "hanyu@xg.edu.cn", enabled: true }
      ]
    },
    {
      name: "征兵与国防教育办公室", head: "周涛", phone: "0731-88830008", email: "zb@xg.edu.cn",
      duty: "大学生征兵入伍、国防教育与预备役工作",
      members: [
        { id: "M801", leader: true, name: "周涛", title: "主任", phone: "0731-88830008", email: "zhoutao@xg.edu.cn", enabled: true },
        { id: "M802", name: "曹阳", title: "征兵干事", phone: "0731-88830081", email: "caoyang@xg.edu.cn", enabled: true }
      ]
    }
  ],

  /* 学院副书记：学工系统同步的只读人员，信箱直接使用；发起学院协同时按来信学生所在学院匹配 */
  colleges: [
    { id: "C01", name: "计算机学院", secretary: "黄志远", title: "党委副书记", phone: "0731-88836101", email: "huangzy@cs.edu.cn", enabled: true },
    { id: "C02", name: "机械学院", secretary: "钟立新", title: "党委副书记", phone: "0731-88836102", email: "zhonglx@me.edu.cn", enabled: true },
    { id: "C03", name: "生命科学学院", secretary: "杜晓梅", title: "党委副书记", phone: "0731-88836103", email: "duxm@life.edu.cn", enabled: true },
    { id: "C04", name: "自动化学院", secretary: "雷鸣", title: "党委副书记", phone: "0731-88836104", email: "leiming@au.edu.cn", enabled: true },
    { id: "C05", name: "材料学院", secretary: "宋佳", title: "党委副书记", phone: "0731-88836105", email: "songjia@mse.edu.cn", enabled: true },
    { id: "C06", name: "商学院", secretary: "叶婧", title: "党委副书记", phone: "0731-88836106", email: "yejing@bs.edu.cn", enabled: true },
    { id: "C07", name: "电信学院", secretary: "程浩", title: "党委副书记", phone: "0731-88836107", email: "chenghao@ee.edu.cn", enabled: true },
    { id: "C08", name: "外国语学院", secretary: "林薇", title: "党委副书记", phone: "0731-88836108", email: "linwei@fl.edu.cn", enabled: true },
    { id: "C09", name: "法学院", secretary: "高远", title: "党委副书记", phone: "0731-88836109", email: "gaoyuan@law.edu.cn", enabled: true }
  ],

  /* 回复承诺：收悉回执写明「N 天内正式回复」（默认 7 天） */
  replyPromiseDays: 7,

  /* 超期时限：超过 N 天未办结视为超期（默认 7 天，与回复承诺分开保存） */
  overdueDays: 7,

  /* 收悉回执模板（M-01） */
  ackTemplate: DEFAULT_ACK_TEMPLATE,

  /* 催办 / 督办消息模板与默认发送渠道（可在「时限与模板」中修改） */
  urgeTemplate: DEFAULT_URGE_TEMPLATE,
  urgeChannels: ["sys", "its"],

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
    { id: "faq1", q: "写信后多久能收到回复？", a: "提交成功后，系统会立即发送收悉回执，承诺在 7 天内给予正式回复。回执只表示来信已收到，不代表办结；正式答复经科室领导审批后由回复人发送给您。", category: "办理流程", order: 1, enabled: true },
    { id: "faq2", q: "我的信件会由谁办理？", a: "来信统一送达学工部综合办公室，由综合办分给承办科室的科室领导（科长）；科长指定本科室回复人拟写答复，并审批每一封正式答复。需要学院协同的事项，由回复人请学生所在学院的副书记协助处理。", category: "办理流程", order: 2, enabled: true },
    { id: "faq3", q: "如何查看我的信件办理进度？", a: "登录后进入「我的信件」，或在「信件查询」中输入信件编号，即可查看收悉回执、分派、办理、答复的完整流程时间轴。", category: "使用指南", order: 3, enabled: true },
    { id: "faq4", q: "对办理结果不满意怎么办？", a: "在信件详情中对答复进行满意度评价；若不满意可点击「申请二次办理」，信件将回到原回复人重新办理，答复仍须科室领导审批后再发给您。", category: "办理流程", order: 4, enabled: true },
    { id: "faq5", q: "信件长时间没有回复怎么办？", a: "待分派或办理中的信件可在详情点击「催办」，系统会提醒当前办理人：未分派时为综合办，待指定回复人或待审批时为科室领导，其余环节为回复人。超过办结时限的信件也会自动提醒并纳入综合办督办。", category: "办理流程", order: 5, enabled: true },
    { id: "faq6", q: "哪些事项不予受理？", a: "非学工部职责范围（如教务、后勤、网络等）、涉及紧急救助（110/119/120）、涉及国家机密或个人隐私、应通过法定程序解决，以及重复无理诉求等事项不予受理。", category: "受理范围", order: 6, enabled: true }
  ]
};

/* ---------------- 受理范围/流程说明文案（写信须知与前台展示共用） ---------------- */
const FLOW_STEPS = [
  { step: "提交来信", actor: "来信人", note: "提交后立即收到收悉回执，承诺 7 天内正式回复" },
  { step: "分给科室领导", actor: "综合办公室", note: "综合办指定承办科室的科室领导（科长）" },
  { step: "指定回复人", actor: "科室领导", note: "科室领导指定本科室回复人" },
  { step: "拟写答复", actor: "回复人", note: "回复人拟写答复；需要时请学院副书记协同" },
  { step: "领导审批", actor: "科室领导", note: "所有答复均须审批，不通过则打回修改" },
  { step: "确认发送", actor: "回复人", note: "审批通过后回复人确认发送，信件办结并接受评价" }
];

/* ---------------- localStorage 工具 ---------------- */
const ROLE_KEYS = ["student", "admin", "leader", "replier", "college"];
function getRole() {
  const r = localStorage.getItem(STORE_KEYS.role);
  if (r === "section") return "replier";
  return ROLE_KEYS.includes(r) ? r : "student";
}
function saveRole(r) { localStorage.setItem(STORE_KEYS.role, r); }

/* 演示默认科室：学生资助管理科（演示数据覆盖各环节） */
const DEMO_SECTION = "学生资助管理科";
const DEMO_COLLEGE = "计算机学院";

/* 科室领导、回复人当前所属科室 */
function getSection() {
  const s = localStorage.getItem(STORE_KEYS.section);
  if (s && MOCK.sections.some(x => x.name === s)) return s;
  return MOCK.sections.some(x => x.name === DEMO_SECTION) ? DEMO_SECTION : MOCK.sections[0].name;
}
function saveSection(s) { localStorage.setItem(STORE_KEYS.section, s); }

/* 学院副书记当前所属学院 */
function getCollege() {
  const c = localStorage.getItem(STORE_KEYS.college);
  const list = collegeList(true);
  if (c && list.some(x => x.name === c)) return c;
  return list.some(x => x.name === DEMO_COLLEGE) ? DEMO_COLLEGE : ((list[0] || {}).name || "");
}
function saveCollege(c) { localStorage.setItem(STORE_KEYS.college, c); }

/* ---------------- 学院副书记（学工系统同步，只读） ---------------- */
function collegeList(onlyEnabled) {
  const list = MOCK.colleges || [];
  return onlyEnabled ? list.filter(c => c.enabled !== false) : list;
}
function findCollege(name) { return collegeList().find(c => c.name === name) || null; }

/* 副书记显示标签：「黄志远（计算机学院党委副书记）」 */
function secretaryLabel(collegeName) {
  const c = findCollege(collegeName);
  return c ? `${c.secretary}（${c.name}${c.title || "副书记"}）` : "";
}

/* ---------------- 科室成员（后台可配置） ---------------- */
function genMemberId() { return "M" + Date.now().toString(36) + Math.floor(Math.random() * 90 + 10); }

/* 某科室的成员列表（onlyEnabled：仅在用成员） */
function sectionMembers(name, onlyEnabled) {
  const s = MOCK.sections.find(x => x.name === name);
  const list = (s && s.members) || [];
  return onlyEnabled ? list.filter(m => m.enabled !== false) : list;
}

/* 科室领导（科长）：成员中 leader=true 的在用成员；未标记时回退到与负责人同名的成员 */
function sectionLeader(name) {
  const list = sectionMembers(name, true);
  const head = (MOCK.sections.find(x => x.name === name) || {}).head;
  return list.find(m => m.leader) || list.find(m => m.name === head) || null;
}

/* 回复人候选：本科室除科室领导以外的在用成员 */
function replierCandidates(name) {
  const leader = sectionLeader(name);
  return sectionMembers(name, true).filter(m => !leader || m.id !== leader.id);
}

/* 按科室 + id 查成员 */
function findMember(section, id) {
  return sectionMembers(section).find(m => m.id === id) || null;
}

/* 全部成员（附带所属科室，用于检索与统计） */
function allMembers() {
  return MOCK.sections.reduce((acc, s) =>
    acc.concat((s.members || []).map(m => Object.assign({ section: s.name }, m))), []);
}

/* 覆盖某科室的成员列表并持久化 */
function saveSectionMembers(section, members) {
  const s = MOCK.sections.find(x => x.name === section);
  if (!s) return;
  s.members = members;
  saveConfig();
}

/* 当前演示身份：回复人。所选科室无该成员时回退到首位候选 */
function getMember() {
  const list = replierCandidates(getSection());
  const id = localStorage.getItem(STORE_KEYS.member);
  return list.find(m => m.id === id) || list[0] || null;
}
function saveMember(id) { localStorage.setItem(STORE_KEYS.member, id); }

/* 兼容旧配置：缺 members 的科室按负责人补一条；无科室领导标记时按负责人补标。
 * 加载时丢掉科室、成员上已废弃的 affairs 字段。 */
function ensureSectionMembers() {
  MOCK.sections.forEach(s => {
    if (!Array.isArray(s.members) || !s.members.length) {
      s.members = s.head
        ? [{ id: genMemberId(), leader: true, name: s.head, title: "科长", phone: s.phone || "", email: s.email || "", enabled: true }]
        : [];
    }
    if (!s.members.some(m => m.leader) && s.members.length) {
      (s.members.find(m => m.name === s.head) || s.members[0]).leader = true;
    }
    delete s.affairs;
    s.members.forEach(m => { delete m.affairs; });
  });
}

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

/* 某科室承办的信件（已分到该科室） */
function getSectionLetters(section) {
  return getAllLetters().filter(l => l.dept === section);
}

/* 待分派信件（已送达综合办、尚未分给科室领导） */
function getPendingLetters() {
  return getAllLetters().filter(l => stageOf(l) === STAGE.pending);
}

/* 某回复人负责的信件 */
function getMemberLetters(memberId) {
  if (!memberId) return [];
  return getAllLetters().filter(l => l.assignee && l.assignee.memberId === memberId);
}

/* 某学院副书记收到的协同信件 */
function getCollabLetters(college) {
  return getAllLetters().filter(l => (l.collabs || []).some(c => c.college === college));
}

/* 某学院副书记可见的已办结信件：本学院来信且公开范围为「全部公开」或「仅该学院副书记可见」 */
function getCollegeVisibleLetters(college) {
  return getAllLetters().filter(l => l.status === STATUS.done && l.unit === college && (l.publicScope === "all" || l.publicScope === "college"));
}

/* 公开信件：已办结且公开范围为「全部公开」 */
function getPublicLetters() {
  return getAllLetters().filter(l => l.status === STATUS.done && l.publicScope === "all");
}

/* 回复人显示标签：「邱敏（资助干事）」 */
function assigneeLabel(l) {
  const a = l && l.assignee;
  if (!a || !a.name) return "";
  return a.name + (a.title ? `（${a.title}）` : "");
}

/* 科室领导显示标签：「陈静（科长）」 */
function leaderLabel(l) {
  const a = l && l.leader;
  if (!a || !a.name) return "";
  return a.name + (a.title ? `（${a.title}）` : "");
}

/* 承办科室显示：未分派时提示待分派 */
function deptLabel(l) { return (l && l.dept) || "待分派"; }

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
  return getMyLetters().find(l => l.status === STATUS.draft);
}

/* ---------------- 办理环节 ---------------- */
function stageOf(l) {
  if (!l) return "";
  if (l.status === STATUS.draft) return STATUS.draft;
  if (l.status === STATUS.withdrawn) return STAGE.withdrawn;
  if (l.status === STATUS.done) return STAGE.done;
  if (l.stage && Object.values(STAGE).includes(l.stage)) return l.stage;
  if (l.status === STATUS.pending || !l.dept) return STAGE.pending;
  return l.assignee ? STAGE.replying : STAGE.needReplier;
}

/* 回复人当前要做的事（回复中 / 已打回 / 待确认发送） */
function isReplierTurn(l) {
  return [STAGE.replying, STAGE.rejected, STAGE.confirm].includes(stageOf(l));
}

/* 当前办理人：待分派 → 综合办；待指定回复人、待审批 → 科室领导；其余办理中环节 → 回复人 */
function currentHandler(l) {
  const st = stageOf(l);
  if (st === STAGE.pending) return { role: "admin", key: "admin", label: MOCK.intakeSection, name: MOCK.intakeSection };
  if (st === STAGE.needReplier || st === STAGE.approving) {
    if (!l.leader) return null;
    return { role: "leader", key: "member:" + l.leader.memberId, label: `${l.dept}科室领导${l.leader.name}`, name: l.leader.name };
  }
  if ([STAGE.replying, STAGE.collab, STAGE.rejected, STAGE.confirm].includes(st)) {
    if (!l.assignee) return null;
    return { role: "replier", key: "member:" + l.assignee.memberId, label: `${l.dept}回复人${l.assignee.name}`, name: l.assignee.name };
  }
  return null;
}
function handlerLabel(l) { const h = currentHandler(l); return h ? h.label : "—"; }

/* 催办/督办的送达对象 */
function urgeTarget(l) { return handlerLabel(l); }

/* 下一步提示（时间轴末尾的待办节点） */
function nextStepText(l) {
  return {
    [STAGE.pending]: "待综合办分给科室领导",
    [STAGE.needReplier]: "待科室领导指定回复人",
    [STAGE.replying]: "待回复人拟写答复并提交审批",
    [STAGE.collab]: "待学院副书记写处理意见",
    [STAGE.approving]: "待科室领导审批",
    [STAGE.rejected]: "待回复人按审批意见修改",
    [STAGE.confirm]: "待回复人确认发送"
  }[stageOf(l)] || "";
}

/* 环节配色 */
function stageColor(stage) {
  return {
    [STAGE.pending]: "#F29100",
    [STAGE.needReplier]: "#E07B00",
    [STAGE.replying]: "#2A8DC7",
    [STAGE.collab]: "#7A5CC2",
    [STAGE.approving]: "#006DAD",
    [STAGE.rejected]: "#DF2027",
    [STAGE.confirm]: "#0F9D8A",
    [STAGE.done]: "#1BB975",
    [STAGE.withdrawn]: "#C8CAD1",
    "草稿": "#627079"
  }[stage] || "#627079";
}

/* ---------------- 流程动作（综合办 → 科室领导 → 回复人 → 审批 → 确认发送） ---------------- */
function genDispatchId() {
  return "DP" + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100);
}
function nowStr() { return formatDateTime(new Date()); }

/* 流程事件：internal 的事件不对学生展示；studentNote 为学生看到的说明 */
function pushFlow(l, ev) {
  if (!l.flow) l.flow = [];
  l.flow.push(Object.assign({ at: nowStr() }, ev));
}

/* 消息接收人 */
function toStudent(l) { return { key: l.owner === "me" ? "student:me" : "student:" + l.id, label: (l.name || "来信人") + "同学" }; }
function toAdmin() { return { key: "admin", label: MOCK.intakeSection }; }
function toLeader(l, who) {
  const a = who || (l && l.leader);
  return a ? { key: "member:" + a.memberId, label: a.name, vars: { 科室领导: a.name } } : null;
}
function toReplier(l, who) {
  const a = who || (l && l.assignee);
  return a ? { key: "member:" + a.memberId, label: a.name, vars: { 回复人: a.name } } : null;
}
function toCollege(name) {
  const c = findCollege(name);
  return c ? { key: "college:" + c.name, label: c.secretary, vars: { 副书记: c.secretary } } : null;
}
function toHandler(l) {
  const h = currentHandler(l);
  return h ? { key: h.key, label: h.label, vars: { 当前办理人: h.label } } : null;
}

/* 学生提交：送达综合办，立即发收悉回执（M-01），并提醒综合办分派（M-03） */
function submitLetter(l, opts) {
  const o = opts || {};
  const at = o.at || nowStr();
  l.status = STATUS.pending; l.stage = STAGE.pending;
  l.dept = ""; l.leader = null; l.assignee = null;
  l.dispatches = []; l.replierAssigns = []; l.approvals = []; l.collabs = []; l.flow = [];
  l.replyDraft = null; l.reply = null; l.publicScope = "";
  pushFlow(l, { step: "提交来信", actor: "来信人", note: `来信人通过学工信箱提交诉求，统一送达${MOCK.intakeSection}`, at });
  const ack = notify(l, "M-01", [toStudent(l)], { 回执时间: at }, Object.assign({}, o, { force: true }));
  l.ack = { at, text: ack.length ? ack[0].text : fillTemplate(MOCK.ackTemplate, l, { 回执时间: at }) };
  pushFlow(l, { step: "收悉回执", actor: "系统", note: `已向来信人发送收悉回执，承诺 ${MOCK.replyPromiseDays} 天内正式回复（不作为正式答复）`, at });
  notify(l, "M-03", [toAdmin()], {}, o);
  return l;
}

/* 综合办分给科室领导；已分派的信件改派到其他科室（原分派记录保留） */
function assignLeader(l, section, note, opts) {
  const o = opts || {};
  const leader = sectionLeader(section);
  if (!leader) return null;
  const at = o.at || nowStr();
  const transfer = !!l.dept && l.dept !== section;
  const oldSection = l.dept, oldLeader = l.leader;
  const rec = {
    id: genDispatchId(), at, by: "admin", type: transfer ? "改派科室" : "分派",
    section, memberId: leader.id, name: leader.name, title: leader.title || "",
    fromSection: transfer ? oldSection : "", fromName: transfer && oldLeader ? oldLeader.name : "",
    note: note || ""
  };
  if (!l.dispatches) l.dispatches = [];
  l.dispatches.push(rec);
  l.dept = section;
  l.leader = { section, memberId: leader.id, name: leader.name, title: leader.title || "" };
  if (transfer) { l.assignee = null; l.replyDraft = null; }
  l.dispatchedAt = at;
  l.status = STATUS.doing; l.stage = STAGE.needReplier;
  pushFlow(l, {
    step: transfer ? "改派科室" : "分给科室领导", actor: MOCK.intakeSection, at,
    note: `分至${section} · ${leaderLabel(l)}` + (transfer ? `，原科室 ${oldSection}` : "") + (note ? `；${note}` : ""),
    studentNote: `已分至${section}办理`
  });
  const vars = { 分派说明: note || "无", 分派时间: at, 原承办科室: oldSection || "" };
  if (transfer) {
    notify(l, "M-05", [toLeader(l), oldLeader ? toLeader(l, oldLeader) : null], vars, o);
  } else {
    notify(l, "M-04", [toLeader(l)], vars, o);
  }
  return rec;
}

/* 科室领导指定 / 改派回复人 */
function assignReplier(l, memberId, note, opts) {
  const o = opts || {};
  const m = findMember(l.dept, memberId);
  if (!m) return null;
  const at = o.at || nowStr();
  const old = l.assignee;
  const change = !!old && old.memberId !== m.id;
  const rec = { at, type: change ? "改派回复人" : "指定回复人", memberId: m.id, name: m.name, title: m.title || "", fromName: change ? old.name : "", note: note || "", by: l.leader ? l.leader.name : "" };
  if (!l.replierAssigns) l.replierAssigns = [];
  l.replierAssigns.push(rec);
  l.assignee = { section: l.dept, memberId: m.id, name: m.name, title: m.title || "" };
  if (stageOf(l) === STAGE.needReplier) l.stage = STAGE.replying;
  pushFlow(l, {
    step: rec.type, actor: `${l.dept}科室领导`, at,
    note: `由 ${assigneeLabel(l)} 回复` + (change ? `，原回复人 ${old.name}` : "") + (note ? `；${note}` : ""),
    studentNote: `已由 ${m.name} 老师负责回复`
  });
  const vars = { 原回复人: change ? old.name : "" };
  if (change) notify(l, "M-07", [toReplier(l), toReplier(l, old)], vars, o);
  else notify(l, "M-06", [toReplier(l)], vars, o);
  return rec;
}

/* 回复人暂存答复 */
function saveReplyDraft(l, content, opts) {
  const o = opts || {};
  l.replyDraft = { content, at: o.at || nowStr(), by: assigneeLabel(l) };
  return l;
}

/* 回复人提交科室领导审批（含打回后的再次提交） */
function submitApproval(l, content, opts) {
  const o = opts || {};
  const at = o.at || nowStr();
  saveReplyDraft(l, content, { at });
  const round = (l.approvals || []).length + 1;
  l.stage = STAGE.approving;
  pushFlow(l, { step: round > 1 ? "修改后再次提交审批" : "提交审批", actor: `${l.dept}回复人`, at, note: `${assigneeLabel(l)} 提交答复，送 ${leaderLabel(l)} 审批（第 ${round} 次）`, internal: true });
  notify(l, "M-08", [toLeader(l)], {}, o);
  return l;
}

/* 科室领导审批：通过 → 待回复人确认发送；不通过 → 打回回复人（须填写意见） */
function approveReply(l, pass, opinion, opts) {
  const o = opts || {};
  const at = o.at || nowStr();
  if (!l.approvals) l.approvals = [];
  l.approvals.push({ at, result: pass ? "pass" : "reject", opinion: opinion || "", by: leaderLabel(l), round: l.approvals.length + 1 });
  l.stage = pass ? STAGE.confirm : STAGE.rejected;
  pushFlow(l, { step: pass ? "审批通过" : "审批打回", actor: `${l.dept}科室领导`, at, note: pass ? (opinion ? `同意：${opinion}` : "同意发送") : `打回修改：${opinion}`, internal: true });
  notify(l, pass ? "M-09" : "M-10", [toReplier(l)], { 审批意见: opinion || "无" }, o);
  return l;
}

/* 回复人发起学院协同：直接发给来信学生所在学院的副书记 */
function startCollab(l, note, opts) {
  const o = opts || {};
  const c = findCollege(l.unit);
  if (!c || c.enabled === false) return null;
  const at = o.at || nowStr();
  if (!l.collabs) l.collabs = [];
  const rec = { id: "CB" + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100), college: c.name, secretary: c.secretary, note: note || "", at, by: assigneeLabel(l), opinion: "", opinionAt: "" };
  l.collabs.push(rec);
  l.stage = STAGE.collab;
  pushFlow(l, { step: "发起学院协同", actor: `${l.dept}回复人`, at, note: `请${c.name}副书记 ${c.secretary} 协同` + (note ? `；${note}` : ""), studentNote: `已请${c.name}协同办理` });
  notify(l, "M-11", [toCollege(c.name)], {}, o);
  return rec;
}

/* 当前未写意见的协同记录 */
function openCollab(l) {
  return (l.collabs || []).slice().reverse().find(c => !c.opinion) || null;
}

/* 副书记写处理意见并发回回复人（线下承办不作为系统审批环节） */
function collabOpinion(l, opinion, opts) {
  const o = opts || {};
  const c = openCollab(l);
  if (!c) return null;
  const at = o.at || nowStr();
  c.opinion = opinion; c.opinionAt = at;
  l.stage = STAGE.replying;
  pushFlow(l, { step: "学院处理意见", actor: `${c.college}副书记`, at, note: `${c.secretary} 写明处理意见并发回回复人：${opinion}`, studentNote: `${c.college}已反馈处理意见` });
  notify(l, "M-13", [toReplier(l)], { 处理意见: opinion }, o);
  return c;
}

/* 回复人确认发送：正式答复发给学生，信件办结，并选择公开范围 */
function confirmSend(l, scope, opts) {
  const o = opts || {};
  const at = o.at || nowStr();
  const draft = l.replyDraft || {};
  l.reply = { dept: l.dept, by: assigneeLabel(l), time: at, content: draft.content || "", approvedBy: leaderLabel(l) };
  l.publicScope = scope === "all" ? "all" : "college";
  l.status = STATUS.done; l.stage = STAGE.done; l.doneAt = at;
  pushFlow(l, { step: "确认发送并办结", actor: `${l.dept}回复人`, at, note: `正式答复已发送给来信人；公开范围：${PUBLIC_SCOPE[l.publicScope]}`, studentNote: "正式答复已发送，信件办结" });
  notify(l, "M-02", [toStudent(l)], { 答复时间: at }, o);
  return l;
}

/* 学生申请二次办理：回到原回复人重新办理，仍须审批并确认发送 */
function requestReopen(l, opts) {
  const o = opts || {};
  const at = o.at || nowStr();
  if (l.reply) {
    if (!l.prevReplies) l.prevReplies = [];
    l.prevReplies.push(Object.assign({}, l.reply, { rating: l.rating || null, ratingComment: l.ratingComment || "" }));
  }
  l.reply = null;
  l.rating = null; l.ratingComment = ""; l.ratingTags = []; l.ratedAt = null;
  l.status = STATUS.doing;
  l.stage = l.assignee ? STAGE.replying : STAGE.needReplier;
  l.reopened = true; l.reopenCount = (l.reopenCount || 0) + 1; l.reopenedAt = at;
  l.deadline = calcDeadline(new Date(at.replace(" ", "T")));
  l.urged = false;
  pushFlow(l, { step: "申请二次办理", actor: "来信人", at, note: `来信人对办理结果不满意，信件回到${l.assignee ? "原回复人 " + l.assignee.name : "科室领导"}重新办理，答复仍须审批` });
  notify(l, "M-22", [toReplier(l), toLeader(l)], { 发起时间: at }, o);
  return l;
}

/* 学生撤回（待分派、办理中可撤回），提醒当前办理人 */
function withdrawLetter(l, opts) {
  const o = opts || {};
  const at = o.at || nowStr();
  const h = toHandler(l);
  l.status = STATUS.withdrawn; l.stage = STAGE.withdrawn;
  pushFlow(l, { step: "来信人撤回", actor: "来信人", at, note: "来信人主动撤回该信件，流程终止" });
  if (h) notify(l, "M-23", [h], { 撤回时间: at }, o);
  return l;
}

/* 学生评价：提醒回复人，抄送科室领导 */
function rateLetter(l, rating, tags, comment, opts) {
  const o = opts || {};
  l.rating = rating; l.ratingTags = tags || []; l.ratingComment = comment || ""; l.ratedAt = formatDate(new Date());
  notify(l, "M-24", [toReplier(l), toLeader(l)], { 评分: rating, 评价内容: comment || "", 评价时间: o.at || nowStr() }, o);
  return l;
}

/* 分派记录列表 HTML（详情/办理端共用；chipCls 决定标签样式：tag / m-tag） */
function dispatchItemsHtml(letter, chipCls) {
  const list = (letter && letter.dispatches) || [];
  if (!list.length) return "";
  const cls = chipCls || "tag";
  return list.map(d => `<div class="dp-item">
      <div class="dp-head">
        <span class="dp-type">${escapeHtml(d.type || "分派")}</span>
        <span class="dp-to"><span class="${cls}">${escapeHtml(d.section)}</span><span class="${cls} info">科室领导 ${escapeHtml(d.name)}${d.title ? "（" + escapeHtml(d.title) + "）" : ""}</span></span>
        <span class="dp-time">${escapeHtml(d.at || "")}</span>
      </div>
      ${d.fromSection ? `<div class="dp-from">原科室：${escapeHtml(d.fromSection)}${d.fromName ? " · " + escapeHtml(d.fromName) : ""}</div>` : ""}
      ${d.note ? `<div class="dp-note">${escapeHtml(d.note)}</div>` : ""}
    </div>`).join("");
}

/* 审批记录 HTML */
function approvalItemsHtml(l) {
  const list = (l && l.approvals) || [];
  if (!list.length) return "";
  return list.map(a => `<div class="ap-item ${a.result === "pass" ? "pass" : "reject"}">
      <div class="ap-head"><span class="ap-res">${a.result === "pass" ? "审批通过" : "审批打回"}</span><span class="ap-meta">第 ${a.round || 1} 次 · ${escapeHtml(a.by || "")} · ${escapeHtml(a.at || "")}</span></div>
      ${a.opinion ? `<div class="ap-text">${escapeHtml(a.opinion)}</div>` : ""}
    </div>`).join("");
}

/* 学院协同记录 HTML */
function collabItemsHtml(l) {
  const list = (l && l.collabs) || [];
  if (!list.length) return "";
  return list.map(c => `<div class="cb-item">
      <div class="cb-head"><span class="cb-to">${escapeHtml(c.college)} · 副书记 ${escapeHtml(c.secretary)}</span><span class="cb-meta">${escapeHtml(c.by || "")} 发起 · ${escapeHtml(c.at || "")}</span></div>
      ${c.note ? `<div class="cb-note">协同说明：${escapeHtml(c.note)}</div>` : ""}
      ${c.opinion
        ? `<div class="cb-opinion"><b>处理意见</b>（${escapeHtml(c.opinionAt || "")}）：${escapeHtml(c.opinion)}</div>`
        : `<div class="cb-wait">等待副书记指定人员线下承办并写处理意见</div>`}
    </div>`).join("");
}

/* ---------------- 消息通知（M-01 ~ M-24） ---------------- */
let _msgBuffer = null;   // 初始化演示数据时批量写入

function getMsgs() {
  if (_msgBuffer) return _msgBuffer;
  try { return JSON.parse(localStorage.getItem(STORE_KEYS.msgs)) || []; }
  catch (e) { return []; }
}
function saveMsgs(list) {
  if (_msgBuffer) return;
  localStorage.setItem(STORE_KEYS.msgs, JSON.stringify(list.slice(0, 800)));
}
function genMsgId() { return "MS" + Date.now().toString(36) + Math.floor(Math.random() * 90000 + 10000); }

/* 信件相关占位符 */
function letterVars(l) {
  const now = nowStr();
  const dl = effectiveDeadline(l);
  const remain = dl ? Math.ceil((new Date(dl + "T23:59:59").getTime() - Date.now()) / 86400000) : 0;
  const col = findCollege(l.unit);
  return {
    姓名: l.name || "来信人", 标题: l.title || "", 编号: l.id || "", 所在单位: l.unit || "-",
    事务分类: l.affair || "", 来信时间: l.createdAt ? formatDateTime(l.createdAt) : (l.date || ""),
    承办科室: l.dept || MOCK.intakeSection, 科室: l.dept || MOCK.intakeSection,
    科室领导: l.leader ? l.leader.name : "科室领导", 回复人: l.assignee ? l.assignee.name : "回复人",
    承办人: l.assignee ? l.assignee.name : "", 副书记: col ? col.secretary : "副书记",
    当前办理人: handlerLabel(l), 办结时限: dl, 已过天数: String(daysSinceCreated(l)),
    剩余天数: String(Math.max(0, remain)), 超期天数: String(Math.max(0, -remain)),
    承诺天数: String(MOCK.replyPromiseDays), 回执时间: now, 答复时间: now, 催办时间: now, 提醒时间: now,
    提交时间: now, 发起时间: now, 撤回时间: now, 评价时间: now, 分派时间: now
  };
}

/* 用信件数据与额外变量填充模板；未知占位符原样保留 */
function fillTemplate(tpl, l, vars) {
  const v = Object.assign(letterVars(l || {}), vars || {});
  return String(tpl || "").replace(/\{([^{}]+)\}/g, (m, k) => (v[k] !== undefined && v[k] !== null) ? String(v[k]) : m);
}

/* 模板正文：M-01 / M-15 / M-16 取管理员配置 */
function templateText(code) {
  if (code === "M-01") return MOCK.ackTemplate || DEFAULT_ACK_TEMPLATE;
  if (code === "M-15" || code === "M-16") return MOCK.urgeTemplate || DEFAULT_URGE_TEMPLATE;
  return (MSG_TEMPLATES[code] || {}).text || "";
}

/* 发送消息：按接收人逐条填充模板并记录。opts.silent 不发送；opts.at 指定时间；opts.read 标记已读 */
function notify(letter, code, recipients, vars, opts) {
  const o = opts || {};
  const tpl = MSG_TEMPLATES[code];
  if (!tpl || (o.silent && !o.force)) return [];
  const at = o.at || nowStr();
  const list = getMsgs();
  const out = [];
  (recipients || []).filter(Boolean).forEach(r => {
    const v = Object.assign({ 提醒时间: at, 催办时间: at }, vars || {}, r.vars || {});
    const msg = {
      id: genMsgId(), code, name: tpl.name, at, to: r.key, toLabel: r.label, letterId: letter.id,
      channel: (o.channel || tpl.channel).slice(),
      text: fillTemplate(templateText(code), letter, v),
      read: !!o.read
    };
    if (!o.silent) list.unshift(msg);
    out.push(msg);
  });
  saveMsgs(list);
  return out;
}

/* 某身份收到的消息（按时间倒序） */
function messagesFor(key) {
  return getMsgs().filter(m => m.to === key).sort((a, b) => (b.at || "").localeCompare(a.at || ""));
}
function unreadCount(key) { return messagesFor(key).filter(m => !m.read).length; }
function markRead(key, id) {
  const list = getMsgs();
  list.forEach(m => { if (m.to === key && (!id || m.id === id)) m.read = true; });
  saveMsgs(list);
}

/* 某封信的消息记录（按时间正序）；forStudent 时只保留发给学生的 */
function letterMessages(l, forStudent) {
  return getMsgs().slice().reverse().filter(m => m.letterId === l.id && (!forStudent || m.to.indexOf("student:") === 0))
    .sort((a, b) => (a.at || "").localeCompare(b.at || ""));
}

/* 消息列表 HTML（消息中心 / 详情共用） */
function messageItemsHtml(msgs, opts) {
  const o = opts || {};
  if (!msgs.length) return `<div class="msg-empty">${o.empty || "暂无消息"}</div>`;
  return msgs.map(m => `<div class="msg-item ${m.read ? "" : "unread"}" data-msg="${escapeHtml(m.id)}" data-msg-letter="${escapeHtml(m.letterId)}">
      <div class="msg-head">
        <span class="msg-code">${escapeHtml(m.code)}</span>
        <span class="msg-name">${escapeHtml(m.name)}</span>
        ${o.showTo ? `<span class="msg-to">→ ${escapeHtml(m.toLabel || "")}</span>` : ""}
        <span class="msg-ch">${(m.channel || []).map(c => CHANNEL_SHORT[c] || c).join(" + ")}</span>
        <span class="msg-time">${escapeHtml(m.at || "")}</span>
      </div>
      <div class="msg-text">${escapeHtml(m.text || "").replace(/\n/g, "<br>")}</div>
    </div>`).join("");
}

/* 自动提醒（M-17 ~ M-20）：每封信每类提醒只发一次 */
function runAutoReminders() {
  const letters = getLetters();
  let changed = false;
  letters.forEach(l => {
    if (l.status !== STATUS.pending && l.status !== STATUS.doing) return;
    const sent = l.autoReminded || {};
    const st = stageOf(l);
    const dl = effectiveDeadline(l);
    const remain = dl ? Math.ceil((new Date(dl + "T23:59:59").getTime() - Date.now()) / 86400000) : 99;
    const fire = (code, to) => {
      if (sent[code]) return;
      notify(l, code, to, {});
      sent[code] = nowStr(); changed = true;
    };
    if (st === STAGE.pending && daysSinceCreated(l) >= MOCK.overdueDays) fire("M-17", [toAdmin()]);
    if (st === STAGE.needReplier && remain <= 2) fire("M-18", [toLeader(l)]);
    if ((st === STAGE.replying || st === STAGE.rejected) && remain >= 0 && remain <= 2) fire("M-19", [toReplier(l), toLeader(l)]);
    if (isOverdue(l)) fire("M-20", [toReplier(l), toLeader(l), toAdmin()]);
    l.autoReminded = sent;
  });
  if (changed) saveLetters(letters);
}

/* ---------------- 配置管理（分类/事务/科室/学院/制度/时限与模板） ---------------- */
/* 持久化结构：{ letterCategories, affairs:[name], sections, colleges, policies, replyPromiseDays, overdueDays, ackTemplate, urgeTemplate, urgeChannels } */
function loadConfig() {
  let cfg;
  try { cfg = JSON.parse(localStorage.getItem(STORE_KEYS.config)); } catch (e) { cfg = null; }
  if (cfg && cfg.letterCategories && cfg.affairs && cfg.sections) {
    MOCK.letterCategories = cfg.letterCategories;
    MOCK.affairCategories = cfg.affairs.map(a => typeof a === "string" ? a : a.name);
    MOCK.sections = cfg.sections;
    if (Array.isArray(cfg.colleges)) MOCK.colleges = cfg.colleges;
    if (cfg.policies) MOCK.policies = cfg.policies;
    if (typeof cfg.replyPromiseDays === "number" && cfg.replyPromiseDays > 0) MOCK.replyPromiseDays = cfg.replyPromiseDays;
    if (typeof cfg.overdueDays === "number" && cfg.overdueDays >= 0) MOCK.overdueDays = cfg.overdueDays;
    if (typeof cfg.ackTemplate === "string" && cfg.ackTemplate.trim()) MOCK.ackTemplate = cfg.ackTemplate;
    if (typeof cfg.urgeTemplate === "string" && cfg.urgeTemplate.trim()) MOCK.urgeTemplate = cfg.urgeTemplate;
    if (Array.isArray(cfg.urgeChannels) && cfg.urgeChannels.length) MOCK.urgeChannels = cfg.urgeChannels;
    ensureSectionMembers();
  } else {
    ensureSectionMembers();
    saveConfig();
  }
}

function currentAffairs() { return MOCK.affairCategories.slice(); }

function saveConfig() {
  const cfg = {
    letterCategories: MOCK.letterCategories,
    affairs: currentAffairs(),
    sections: MOCK.sections,
    colleges: MOCK.colleges,
    policies: MOCK.policies,
    replyPromiseDays: MOCK.replyPromiseDays,
    overdueDays: MOCK.overdueDays,
    ackTemplate: MOCK.ackTemplate,
    urgeTemplate: MOCK.urgeTemplate,
    urgeChannels: MOCK.urgeChannels
  };
  localStorage.setItem(STORE_KEYS.config, JSON.stringify(cfg));
}

function saveCategories(list) { MOCK.letterCategories = list; saveConfig(); }
function saveAffairs(list) { MOCK.affairCategories = list.slice(); saveConfig(); }
function saveSections(list) { MOCK.sections = list; ensureSectionMembers(); saveConfig(); }
function savePolicies(list) { MOCK.policies = list; saveConfig(); }

/* 保存「时限与模板」：回复承诺天数 + 超期天数 + 回执模板 + 催办模板 + 默认渠道 */
function saveTimeConfig(c) {
  MOCK.replyPromiseDays = c.promiseDays;
  MOCK.overdueDays = c.overdueDays;
  MOCK.ackTemplate = c.ackTemplate;
  MOCK.urgeTemplate = c.urgeTemplate;
  MOCK.urgeChannels = (c.channels && c.channels.length) ? c.channels : ["sys"];
  saveConfig();
}

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
  share: '<circle cx="5.5" cy="12" r="2.5"/><circle cx="18.5" cy="6" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/><path d="m7.8 10.9 8.4-3.8M7.8 13.1l8.4 3.8"/>',
  userCheck: '<circle cx="10" cy="8" r="3.4"/><path d="M4 19.5a6 6 0 0 1 10.4-4.1"/><path d="m15.5 17.8 1.9 1.9 3.4-3.9"/>',
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
  const h = toHandler(letter);
  if (h) notify(letter, "M-21", [h], { 提交时间: letter.supplements[letter.supplements.length - 1].at });
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

/* 用信件数据填充催办模板（{当前办理人} 按环节自动确定） */
function fillUrgeTemplate(letter, template) {
  return fillTemplate(template || MOCK.urgeTemplate || DEFAULT_URGE_TEMPLATE, letter, {});
}

/* 渠道数组 → 中文短标签串（如「系统消息、ITS」） */
function channelLabel(channels) {
  return (channels || []).map(c => CHANNEL_SHORT[c] || c).join("、");
}

/* 发送催办 / 督办：学生催办为 M-15，综合办督办为 M-16，均发给当前办理人 */
function sendUrge(letter, channels, by) {
  const ch = (channels && channels.length) ? channels : (MOCK.urgeChannels || ["sys"]);
  const text = fillUrgeTemplate(letter);
  const h = currentHandler(letter);
  const rec = {
    id: genReminderId(),
    at: nowStr(),
    by: by || "student",
    channel: ch.slice(),
    text: text,
    to: h ? h.label : "",
    sectionId: letter.dept || MOCK.intakeSection,
    memberId: (letter.assignee && letter.assignee.memberId) || ""
  };
  if (!letter.reminders) letter.reminders = [];
  letter.reminders.push(rec);
  letter.urged = true;
  letter.urgedAt = rec.at;
  const to = toHandler(letter);
  if (to) notify(letter, by === "student" ? "M-15" : "M-16", [to], {}, { channel: ch });
  return rec;
}

/* 催办记录列表 HTML（详情/办理端共用） */
function reminderItemsHtml(letter) {
  const rms = (letter && letter.reminders) || [];
  if (!rms.length) return "";
  const byLabel = { student: "来信人", admin: "综合办" };
  return rms.map((r, i) => `<div class="urge-item">
      <div class="urge-head">
        <span class="urge-idx">催办 ${i + 1}</span>
        <span class="urge-ch">${(r.channel || []).map(c => `<span class="urge-chip">${CHANNEL_SHORT[c] || c}</span>`).join("")}</span>
        <span class="urge-time">${escapeHtml(r.at || "")} · ${byLabel[r.by] || r.by || ""}${r.to ? " → " + escapeHtml(r.to) : ""}</span>
      </div>
      <div class="urge-text">${escapeHtml(r.text || "")}</div>
    </div>`).join("");
}

/* ---------------- 富文本工具栏（桌面/移动共用；仅按钮 class 不同） ---------------- */
function rtToolbarHtml(btn) {
  const b = (cmd, label, title, val) => `<button type="button" class="${btn}" data-cmd="${cmd}"${val ? ` data-value="${val}"` : ""} title="${title}">${label}</button>`;
  const sw = (cmd, color, title, hl) => `<button type="button" class="rt-swatch${hl ? " rt-hl" : ""}" data-cmd="${cmd}" data-value="${color}" title="${title}" style="background:${color}"></button>`;
  const fore = [["#2A8DC7", "主蓝"], ["#1BB975", "成功绿"], ["#F29100", "警告橙"], ["#DF2027", "危险红"], ["#3C444F", "墨黑"]];
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

/* 按统一超期天数计算办结时限（基准日 + overdueDays） */
function calcDeadline(createdAt) {
  const days = Number.isFinite(MOCK.overdueDays) ? MOCK.overdueDays : 7;
  const d = new Date(createdAt);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/* 办理流程时间轴：按流程事件生成；forStudent 时隐藏内部审批事件，并使用面向学生的说明 */
function buildProcessLog(letter, forStudent) {
  let flow = (letter.flow || []).slice();
  if (!flow.length) {
    flow = [{ step: "提交来信", actor: "来信人", at: letter.createdAt ? formatDateTime(letter.createdAt) : "", note: `来信人通过学工信箱提交诉求，统一送达${MOCK.intakeSection}` }];
  }
  const log = flow.filter(f => !(forStudent && f.internal)).map(f => ({
    step: f.step, time: f.at || "", actor: f.actor || "", done: true,
    note: escapeHtml(forStudent && f.studentNote ? f.studentNote : (f.note || ""))
  }));
  return withSupplements(log, letter);
}

/* 按时间顺序插入补充材料节点 */
function withSupplements(log, letter) {
  const sups = letter.supplements || [];
  if (!sups.length || !log.length) return log;
  const nodes = sups.map(s => {
    const cnt = (s.attachments && s.attachments.length) || 0;
    let note = s.text ? (s.text.length > 42 ? s.text.slice(0, 42) + "…" : s.text) : "";
    if (cnt) note += (note ? " " : "") + `（含 ${cnt} 个附件）`;
    return { step: "补充材料", time: s.at || "", actor: "来信人", note: escapeHtml(note || "提交补充材料"), done: true };
  });
  return log.concat(nodes).map((x, i) => ({ x, i }))
    .sort((a, b) => (a.x.time || "").localeCompare(b.x.time || "") || a.i - b.i)
    .map(o => o.x);
}

/* 多条件过滤 */
function filterLetters(letters, f) {
  f = f || {};
  return letters.filter(l => {
    if (f.mailbox && l.mailbox !== f.mailbox) return false;
    if (f.section && l.dept !== f.section) return false;
    if (f.member && !(l.assignee && l.assignee.memberId === f.member)) return false;
    if (f.status && l.status !== f.status) return false;
    if (f.stage && stageOf(l) !== f.stage) return false;
    if (f.category && l.category !== f.category) return false;
    if (f.affair && l.affair !== f.affair) return false;
    if (f.title && !(l.title || "").includes(f.title)) return false;
    if (f.content && !(l.content || "").includes(f.content)) return false;
    if (f.dept && !deptLabel(l).includes(f.dept)) return false;
    if (f.assignee && !(assigneeLabel(l) || "").includes(f.assignee)) return false;
    if (f.unit && !(l.unit || "").includes(f.unit)) return false;
    if (f.start && l.date < f.start) return false;
    if (f.end && l.date > f.end) return false;
    return true;
  });
}

function statusColor(status) {
  /* 对齐学工状态色板：待分派橙 / 进行中蓝 / 完成绿 / 中性灰 */
  return {
    "草稿": "#627079",
    "待分派": "#F29100",
    "办理中": "#2A8DC7",
    "已办结": "#1BB975",
    "已撤回": "#C8CAD1"
  }[status] || "#627079";
}

/* 依据当前 overdueDays 动态计算办结时限（二次办理从申请日重新起算） */
function effectiveDeadline(letter) {
  if (!letter) return "";
  const base = letter.reopenedAt ? letter.reopenedAt.replace(" ", "T") : letter.createdAt;
  if (!base) return letter.deadline || "";
  return calcDeadline(base);
}

/* 是否超期未办结 */
function isOverdue(letter) {
  if (letter.status === "已办结" || letter.status === "已撤回" || letter.status === "草稿") return false;
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

/* 演示信件的目标环节与办理内容（未列出的：已办结按原答复走完全流程，办理中停在「回复中」） */
const SEED_FLOW = {
  "XG20260612118": { replier: "M402", reject: "请补充各学院名额分配方案的具体公示时间，便于学生监督。", firstDraft: "感谢您的建议。本年度评定已细化困难认定与学业进步权重。" },
  "XG20260620133": { collab: "请学院核实该生所在年级困难认定的线上申报安排。", opinion: "学院已安排辅导员一对一指导该生完成线上申报，材料清单已当面告知。" },
  "XG20260701203": { stage: STAGE.replying, draft: "同学您好，公寓管理科已收到您的床位调整申请，" },
  "XG20260714077": { stage: STAGE.needReplier },
  "XG20260706166": { stage: STAGE.approving, replier: "M402", draft: "经核实，上月勤工助学工资因报账周期调整延后，已于本周完成补发，请注意查收。后续将固定每月 15 日前发放。" },
  "XG20260709188": { stage: STAGE.collab, collab: "请学院统计本院秋招意向行业，便于就业中心安排专场。" },
  "XG20260630120": { stage: STAGE.rejected, firstDraft: "经复核，维持原处理决定。", reject: "答复过于简单，请写明复核依据，并说明社团活动审批材料的核查结果。" },
  "XG20260702101": { stage: STAGE.confirm, draft: "您好，学工信箱来信统一由综合办公室受理后分给相关科室办理，可在「我的信件」查看进度；目前暂不支持匿名提交，个人信息仅用于办理联系。" },
  "XG20260311182": { stage: STAGE.replying, collab: "请学院核实该生当日考勤记录与请假审批情况。", opinion: "经学院核实，该生当日已提交请假申请但审批未及时流转，建议撤销本次考勤违纪认定。", draft: "经学院核实，" }
};

/* 在流程中的演示来信（相对今天生成，覆盖演示科室「学生资助管理科」与演示学院「计算机学院」） */
function seedInFlow() {
  const mk = (daysAgo, hour) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, 10, 0, 0);
    return d;
  };
  const S = "学生资助管理科";
  const base = [
    { n: "401", daysAgo: 1, hour: 10, title: "关于国家助学金第二批发放时间的咨询", category: "咨询类", affair: "奖助学金", name: "唐*", unit: "机械学院", level: "一般",
      content: "老师您好，想咨询本学期国家助学金第二批的发放时间，以及是否需要重新确认银行卡信息，谢谢。", spec: { stage: STAGE.needReplier } },
    { n: "402", daysAgo: 2, hour: 9, title: "关于家庭经济困难认定档次复核的申请", category: "问题类", affair: "困难认定", name: "罗*", unit: "商学院", level: "重要",
      content: "本人对本年度困难认定档次有异议，家庭近期情况有较大变化，申请复核认定档次，并想了解需要补充哪些证明材料。", spec: { stage: STAGE.replying, replier: "M402", draft: "同学您好，困难认定档次复核需提交" } },
    { n: "403", daysAgo: 3, hour: 14, title: "关于学院励志奖学金推荐名单公示不清的反映", category: "问题类", affair: "奖助学金", name: "许*", unit: "计算机学院", level: "重要",
      content: "学院励志奖学金推荐名单只在班级群里简单通知，未看到正式公示和公示期，希望核实推荐流程是否规范。", spec: { stage: STAGE.collab, replier: "M402", collab: "请学院核实本院推荐名单的公示时间、范围与公示期。" } },
    { n: "404", daysAgo: 3, hour: 10, title: "关于勤工助学岗位申请条件的咨询", category: "咨询类", affair: "勤工助学", name: "白*", unit: "自动化学院", level: "一般",
      content: "想了解本学期校内勤工助学岗位的申请条件、开放时间和报名入口，非困难生是否可以申请？", spec: { stage: STAGE.rejected, replier: "M402", firstDraft: "同学您好，勤工助学岗位优先面向家庭经济困难学生，非困难生也可申请。", reject: "答复未说明岗位开放时间与报名入口，请补充后再提交。" } },
    { n: "405", daysAgo: 4, hour: 15, title: "关于临时困难补助申请材料的咨询", category: "咨询类", affair: "困难认定", name: "江*", unit: "计算机学院", level: "一般",
      content: "家里近期遇到突发情况，想申请临时困难补助，请问需要准备哪些材料，学院和学工部分别负责哪些环节？", spec: { stage: STAGE.confirm, replier: "M402", collab: "请学院协助核实该生家庭突发情况。", opinion: "学院已由辅导员走访核实，情况属实，同意推荐申请临时困难补助。",
        draft: "同学您好，临时困难补助需提交申请表、情况说明及相关证明材料。经学院核实，您的情况符合申请条件，请于本周内将材料交至学院学工办，学工部资助管理科审核后发放。" } },
    { n: "406", daysAgo: 2, hour: 16, title: "关于新生绿色通道办理流程的咨询", category: "咨询类", affair: "困难认定", name: "龙*", unit: "法学院", level: "一般",
      content: "想了解新生入学时绿色通道的办理流程，以及缓缴学费后的后续手续。", spec: { stage: STAGE.approving, replier: "M402", draft: "同学您好，新生可凭录取通知书和家庭经济困难证明在报到当天办理绿色通道，缓缴学费须在开学一个月内完成国家助学贷款或困难认定手续。" } },
    { n: "407", daysAgo: 6, hour: 9, title: "关于学院奖学金评定细则的疑问", category: "咨询类", affair: "奖助学金", name: "严*", unit: "计算机学院", level: "一般",
      content: "学院奖学金评定细则中关于竞赛加分的计算方式不太清楚，希望能解释一下。", spec: { stage: STAGE.done, replier: "M402", scope: "college", endDaysAgo: 4,
        draft: "同学您好，竞赛加分按学院评定细则第五条执行：国家级一等奖加 5 分，省级一等奖加 3 分，同一项目取最高级别，不重复加分。" } }
  ];
  return base.map(b => {
    const d = mk(b.daysAgo, b.hour);
    const id = "XG" + formatDate(d).replace(/-/g, "") + b.n;
    const spec = Object.assign({}, b.spec);
    if (spec.endDaysAgo) { const e = mk(spec.endDaysAgo, 16); spec.end = formatDateTime(e); }
    return {
      id, mailbox: MOCK.mailbox, owner: "other",
      title: b.title, category: b.category, affair: b.affair,
      name: b.name, idInfo: "保密", phone: "13*****" + b.n, email: "",
      unit: b.unit, address: "", content: b.content, level: b.level,
      status: spec.stage === STAGE.done ? STATUS.done : STATUS.doing, dept: S,
      createdAt: d.toISOString(), date: formatDate(d),
      reply: spec.stage === STAGE.done ? { content: spec.draft, time: spec.end } : null,
      rating: null, attachments: [], _spec: spec
    };
  });
}

/* 各科室领导工作台的待指定 / 待审批。
   待指定回复人只分到科室领导、尚未指定回复人；待审批由回复人提交后仍由科室领导审批。
   学生资助管理科已在 seedInFlow 覆盖，这里不重复生成。 */
function seedLeaderQueues() {
  const mk = (daysAgo, hour) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, 25, 0, 0);
    return d;
  };
  const base = [
    { n: "611", dept: "学生公寓管理科", daysAgo: 1, hour: 9, title: "关于宿舍空调外机夜间噪音影响休息的问题反映", category: "问题类", affair: "宿舍管理", name: "何*", unit: "计算机学院", level: "重要",
      content: "老师您好，我所在宿舍楼的空调外机正对窗户，夜间持续运转，噪音很大，已经影响入睡。希望公寓管理科核实情况，并协调调整安装位置或做隔音处理，谢谢。",
      spec: { stage: STAGE.needReplier } },
    { n: "612", dept: "学生公寓管理科", daysAgo: 2, hour: 11, title: "关于申请调至同楼层空余床位的咨询", category: "咨询类", affair: "住宿调整", name: "马*", unit: "电信学院", level: "一般",
      content: "本人与室友作息差异较大，了解到同楼层目前有空余床位。想咨询本学期能否申请调换，需要提交哪些材料，以及由谁审批。",
      spec: { stage: STAGE.needReplier } },
    { n: "613", dept: "学生公寓管理科", daysAgo: 2, hour: 15, title: "关于延长宿舍楼洗衣房开放时间的建议", category: "建议类", affair: "宿舍管理", name: "林*", unit: "机械学院", level: "一般",
      content: "宿舍洗衣房目前晚上九点就关闭，晚自习回来经常赶不上。建议工作日延长至十一点，方便同学洗衣。",
      spec: { stage: STAGE.approving, replier: "M602", draft: "同学您好，已核实洗衣房开放时间。考虑到晚自习返回后的实际需要，工作日开放时间拟调整为 7:00 至 23:00，周末保持现有安排。具体执行时间将在楼栋公告栏和公寓群通知。" } },
    { n: "614", dept: "学生公寓管理科", daysAgo: 3, hour: 10, title: "关于毕业离校宿舍退宿手续的咨询", category: "咨询类", affair: "住宿调整", name: "吴*", unit: "商学院", level: "一般",
      content: "今年六月毕业，想了解退宿的时间安排、钥匙和门禁卡的归还地点，以及个人物品未及时搬离时会如何处理。",
      spec: { stage: STAGE.approving, replier: "M602", draft: "同学您好，毕业生退宿安排在离校手续周内完成。请携带钥匙和门禁卡到楼栋值班室办理，房间物品须当日清空。逾期未搬离的物品由公寓统一登记保管，具体日程见离校通知。" } },

    { n: "621", dept: "综合办公室", daysAgo: 1, hour: 14, title: "关于学工信箱公开答复如何查阅的咨询", category: "咨询类", affair: "其他事务", name: "郑*", unit: "法学院", level: "一般",
      content: "老师您好，想了解已经办结并选择公开的来信，学生在哪里可以查阅正式答复，是否可以按学院筛选。",
      spec: { stage: STAGE.needReplier } },
    { n: "622", dept: "综合办公室", daysAgo: 3, hour: 16, title: "关于来信办理进度增加短信提醒的建议", category: "建议类", affair: "其他事务", name: "钱*", unit: "外国语学院", level: "一般",
      content: "建议学工信箱在信件分派、指定回复人和发出正式答复时，给来信人发送短信提醒，避免只能登录系统才能看到进度。",
      spec: { stage: STAGE.approving, replier: "M103", draft: "同学您好，目前办理进度可在「我的信件」和系统消息中查看，分派、指定回复人和正式答复等节点都会发送站内消息。短信提醒涉及统一身份认证和短信网关，已列入后续优化，现阶段先保证站内每一步可查。" } },

    { n: "631", dept: "思想政治教育科", daysAgo: 1, hour: 10, title: "关于增加红色教育实践名额的建议", category: "建议类", affair: "思想教育", name: "高*", unit: "材料学院", level: "一般",
      content: "学院红色教育实践的名额比较少，不少同学报名后没能参加。建议适当增加名额，或分批次安排，让更多同学有机会参加。",
      spec: { stage: STAGE.needReplier } },
    { n: "632", dept: "思想政治教育科", daysAgo: 2, hour: 15, title: "关于入党积极分子培训开班时间的咨询", category: "咨询类", affair: "党团组织", name: "丁*", unit: "计算机学院", level: "一般",
      content: "老师您好，想咨询本学期入党积极分子培训的开班时间、上课地点和报名方式。错过学院通知的同学应当如何补报？",
      spec: { stage: STAGE.approving, replier: "M202", draft: "同学您好，本学期入党积极分子培训拟定于第 6 教学周周末开班，地点在大学生活动中心报告厅。请通过学院团委报名；已错过学院通知的同学，可在开班前三个工作日内向学院团委补报。" } },

    { n: "641", dept: "学生日常管理科", daysAgo: 2, hour: 9, title: "关于休学复学后学生证换发时间的咨询", category: "咨询类", affair: "学籍异动", name: "蔡*", unit: "自动化学院", level: "一般",
      content: "我已办完复学手续，学生证上的信息还没有更新。想咨询换发学生证的办理时间和需要携带的材料。",
      spec: { stage: STAGE.needReplier } },
    { n: "642", dept: "学生日常管理科", daysAgo: 1, hour: 16, title: "关于请假系统无法上传医院证明的问题反映", category: "问题类", affair: "请假考勤", name: "任*", unit: "生命科学学院", level: "重要",
      content: "申请病假时上传医院证明一直失败，提示格式不支持。jpg 和 pdf 都试过了。希望尽快修复，否则无法按时完成请假。",
      spec: { stage: STAGE.approving, replier: "M302", draft: "同学您好，经核实，请假系统对超过 10MB 的证明材料会上传失败。请先将图片压缩后重新提交。我们已请信息化部门放宽大小限制，预计本周内完成。在此期间，可将证明交学院辅导员登记，不作为缺勤处理。" } },

    { n: "651", dept: "心理健康教育中心", daysAgo: 2, hour: 14, title: "关于心理咨询预约后改期规则的咨询", category: "咨询类", affair: "心理咨询", name: "方*", unit: "外国语学院", level: "一般",
      content: "我已预约本周三的心理咨询，临时和课程冲突。想了解能否改期、最晚什么时候申请，以及改期会不会影响以后的预约。",
      spec: { stage: STAGE.approving, replier: "M502", draft: "同学您好，已预约的咨询如需改期，请至少提前一个工作日在预约系统中操作，或电话联系心理中心前台。本学期每位同学可改期一次，不影响后续正常预约。您这次可改至本周五下午，具体时段请在系统中选择。" } },

    { n: "661", dept: "就业创业指导中心", daysAgo: 1, hour: 11, title: "关于未就业毕业生档案转递去向的咨询", category: "咨询类", affair: "就业指导", name: "姚*", unit: "商学院", level: "重要",
      content: "毕业时还没有签订三方协议，想咨询档案和户口是转回生源地还是可以暂留学校，以及办理的截止时间。",
      spec: { stage: STAGE.needReplier } },
    { n: "662", dept: "就业创业指导中心", daysAgo: 3, hour: 15, title: "关于创业园区入驻需要哪些材料的咨询", category: "咨询类", affair: "创业服务", name: "秦*", unit: "机械学院", level: "一般",
      content: "我们团队想申请入驻学校创业园区，想了解需要准备哪些材料、评审安排在什么时间，以及场地使用是否收费。",
      spec: { stage: STAGE.approving, replier: "M702", draft: "同学您好，入驻创业园区需提交项目计划书、团队成员名单和指导教师意见。本学期评审安排在每月第一周，通过后免场地租金，水电按园区标准结算。材料请发送至就业创业指导中心邮箱，或于工作日到中心窗口提交。" } },

    { n: "671", dept: "征兵与国防教育办公室", daysAgo: 1, hour: 8, title: "关于在校生应征体检复查安排的咨询", category: "咨询类", affair: "征兵入伍", name: "侯*", unit: "电信学院", level: "重要",
      content: "初检有一项没有通过，通知可以复查。想咨询复查的时间、地点，以及复查前需要注意什么。",
      spec: { stage: STAGE.needReplier } },
    { n: "672", dept: "征兵与国防教育办公室", daysAgo: 4, hour: 10, title: "关于退役复学学费补偿何时发放的咨询", category: "咨询类", affair: "国防教育", name: "孟*", unit: "计算机学院", level: "一般",
      content: "我已办完退役复学，学费补偿材料也交齐了。想确认补偿款什么时候发放，是打到银行卡，还是直接冲抵学费。",
      spec: { stage: STAGE.approving, replier: "M802", draft: "同学您好，退役复学学费补偿在材料审核通过后，一般于复学学期的第二个月发放至您登记的银行卡，不直接冲抵学费。您的材料已审核通过，预计下月 15 日前到账，请留意短信通知。" } }
  ];
  return base.map(b => {
    const d = mk(b.daysAgo, b.hour);
    const id = "XG" + formatDate(d).replace(/-/g, "") + b.n;
    return {
      id, mailbox: MOCK.mailbox, owner: "other",
      title: b.title, category: b.category, affair: b.affair,
      name: b.name, idInfo: "保密", phone: "13*****" + b.n, email: "",
      unit: b.unit, address: "", content: b.content, level: b.level,
      status: STATUS.doing, dept: b.dept,
      createdAt: d.toISOString(), date: formatDate(d),
      reply: null, rating: null, attachments: [], _spec: b.spec
    };
  });
}

/* 待分派演示来信：日期相对「今天」生成，保证任何时候打开原型都有新鲜的待办 */
function seedPending() {
  const mk = (daysAgo, hour) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, 20, 0, 0);
    return d;
  };
  /* 比当前超期天数再早 2 天，沿用 isOverdue（今天晚于办结时限）标成超期未分派 */
  const overdueAgo = (Number.isFinite(MOCK.overdueDays) ? MOCK.overdueDays : 7) + 2;
  const base = [
    {
      id: "XG" + formatDate(mk(0, 9)).replace(/-/g, "") + "301", owner: "me", daysAgo: 0, hour: 9,
      title: "关于开设考研自习室延时开放的建议", category: "建议类", affair: "其他事务",
      name: "李诚", idInfo: "8201230314", phone: "13874105021", email: "licheng@example.edu.cn",
      unit: "计算机学院", address: "杏林校区A栋315", level: "一般",
      content: "临近考研，图书馆与教学楼自习区座位紧张且关闭较早，建议学工部协调开设考研专用自习室并延时开放至 23:00，帮助备考同学安心复习。",
      attachments: []
    },
    {
      id: "XG" + formatDate(mk(1, 20)).replace(/-/g, "") + "302", owner: "other", daysAgo: 1, hour: 20,
      title: "关于宿舍热水供应时间调整的问题反映", category: "问题类", affair: "宿舍管理",
      name: "许*", idInfo: "保密", phone: "138****4417", email: "",
      unit: "机械学院", address: "", level: "重要",
      content: "近期宿舍楼热水供应时间提前结束，晚自习返回后经常没有热水，影响日常生活，希望能核实并适当延长供应时段。",
      attachments: []
    },
    {
      id: "XG" + formatDate(mk(1, 15)).replace(/-/g, "") + "303", owner: "other", daysAgo: 1, hour: 15,
      title: "关于家庭突发变故申请临时困难补助的求助", category: "问题类", affair: "困难认定",
      name: "梁*", idInfo: "保密", phone: "159****2208", email: "",
      unit: "生命科学学院", address: "", level: "疑难",
      content: "本人家中近期突发变故，家庭经济状况骤然困难，恳请学校核实情况后给予临时困难补助，并告知需要补充哪些材料，谢谢老师。",
      attachments: [{ name: "情况说明及证明材料.pdf", size: 683008, type: "application/pdf" }]
    },
    {
      id: "XG" + formatDate(mk(2, 11)).replace(/-/g, "") + "304", owner: "other", daysAgo: 2, hour: 11,
      title: "关于秋季征兵体检安排的咨询", category: "咨询类", affair: "征兵入伍",
      name: "戴*", idInfo: "保密", phone: "137****9931", email: "",
      unit: "自动化学院", address: "", level: "一般",
      content: "老师您好，想咨询本次秋季征兵的体检时间、地点与需要携带的材料，以及在校生报名的具体流程，谢谢。",
      attachments: []
    },
    {
      id: "XG" + formatDate(mk(overdueAgo, 8)).replace(/-/g, "") + "305", owner: "other", daysAgo: overdueAgo, hour: 8,
      title: "关于宿舍楼夜间门禁登记排队过长的问题反映", category: "问题类", affair: "宿舍管理",
      name: "沈*", idInfo: "保密", phone: "136****7812", email: "",
      unit: "材料学院", address: "", level: "重要",
      content: "近期宿舍楼夜间返寝需要在门岗逐一登记，排队经常超过二十分钟，影响休息。希望能优化登记方式，减少同学等候时间。",
      attachments: []
    }
  ];
  return base.map(b => {
    const d = mk(b.daysAgo, b.hour);
    return {
      id: b.id, mailbox: MOCK.mailbox, owner: b.owner,
      title: b.title, category: b.category, affair: b.affair,
      name: b.name, idInfo: b.idInfo, phone: b.phone, email: b.email,
      unit: b.unit, address: b.address,
      content: b.content, status: STATUS.pending, level: b.level, dept: "",
      createdAt: d.toISOString(), date: formatDate(d),
      reply: null, rating: null, attachments: b.attachments, _spec: { stage: STAGE.pending }
    };
  });
}

/* 用真实流程动作把一封演示信件推进到目标环节（生成分派、指定、协同、审批、发送记录与消息） */
function seedFlow(raw, rot) {
  const l = Object.assign({}, raw);
  const spec = Object.assign({}, l._spec || SEED_FLOW[l.id] || {});
  if (!spec.stage) spec.stage = l.status === STATUS.done ? STAGE.done : (l.status === STATUS.pending ? STAGE.pending : STAGE.replying);
  if (!spec.scope) spec.scope = l.isPublic === "no" ? "college" : "all";
  const keep = { dept: l.dept, reply: l.reply, rating: l.rating, ratingTags: l.ratingTags, ratingComment: l.ratingComment, ratedAt: l.ratedAt, urged: l.urged };
  delete l._spec; delete l.isPublic; delete l.suggestDept;
  l.urged = false; l.reopened = false; l.supplements = []; l.reminders = [];

  const target = spec.stage;
  const t0 = new Date(l.createdAt).getTime();
  const endStr = spec.end || (keep.reply && keep.reply.time) || "";
  const endT = endStr ? new Date(endStr.replace(" ", "T")).getTime() : 0;
  const nowT = Date.now();
  let k = 0;
  let last = t0;
  const at = () => {
    k += 1;
    let t;
    if (endT) t = t0 + (endT - t0) * k / 9;
    else {
      const d = new Date(last + 2.5 * 3600000);
      if (d.getHours() >= 21) { d.setDate(d.getDate() + 1); d.setHours(8, 40, 0, 0); }
      else if (d.getHours() < 8) d.setHours(8, 40, 0, 0);
      t = Math.min(d.getTime(), nowT - (12 - k) * 60000);
      last = t;
    }
    return formatDateTime(new Date(t));
  };
  const quiet = target === STAGE.done && l.owner !== "me";
  const o = () => ({ at: at(), silent: quiet });

  submitLetter(l, { at: formatDateTime(new Date(t0)), silent: quiet });
  l.deadline = calcDeadline(l.createdAt);
  if (target === STAGE.withdrawn) {
    withdrawLetter(l, o());
    return finishSeed(l, keep);
  }
  if (target === STAGE.pending) return finishSeed(l, keep);

  assignLeader(l, keep.dept, `请${keep.dept}核实办理`, o());
  if (target === STAGE.needReplier) return finishSeed(l, keep);

  const cands = replierCandidates(l.dept);
  const n = rot[l.dept] || 0;
  rot[l.dept] = n + 1;
  const m = (spec.replier && cands.find(x => x.id === spec.replier)) || cands[n % Math.max(1, cands.length)];
  if (!m) return finishSeed(l, keep);
  assignReplier(l, m.id, "", o());

  const content = (keep.reply && keep.reply.content) || spec.draft || "";
  if (spec.collab) {
    startCollab(l, spec.collab, o());
    if (target === STAGE.collab) return finishSeed(l, keep);
    collabOpinion(l, spec.opinion || "学院已安排专人线下承办，情况已核实。", o());
  }
  if (target === STAGE.replying) {
    if (spec.draft) saveReplyDraft(l, spec.draft, { at: at() });
    return finishSeed(l, keep);
  }
  if (spec.reject) {
    submitApproval(l, spec.firstDraft || content, o());
    approveReply(l, false, spec.reject, o());
    if (target === STAGE.rejected) return finishSeed(l, keep);
  }
  submitApproval(l, content, o());
  if (target === STAGE.approving) return finishSeed(l, keep);
  approveReply(l, true, "", o());
  if (target === STAGE.confirm) return finishSeed(l, keep);

  confirmSend(l, spec.scope, { at: endStr || at(), silent: quiet });
  if (keep.rating) {
    l.rating = keep.rating; l.ratingTags = keep.ratingTags || []; l.ratingComment = keep.ratingComment || "";
    l.ratedAt = keep.ratedAt || (endStr ? endStr.slice(0, 10) : formatDate(new Date()));
    if (!quiet) notify(l, "M-24", [toReplier(l), toLeader(l)], { 评分: l.rating, 评价内容: l.ratingComment, 评价时间: l.ratedAt + " 10:00" }, { at: l.ratedAt + " 10:00" });
  }
  return finishSeed(l, keep);
}

/* 李诚已撤回的来信：提交后、分派前撤回，出现在学生「我的信件」 */
function seedWithdrawn() {
  const d = new Date();
  d.setDate(d.getDate() - 5);
  d.setHours(11, 5, 0, 0);
  return [{
    id: "XG" + formatDate(d).replace(/-/g, "") + "510",
    mailbox: MOCK.mailbox, owner: "me",
    title: "关于国家助学贷款回执确认时间的咨询", category: "咨询类", affair: "奖助学金",
    name: "李诚", idInfo: "8201230314", phone: "13874105021", email: "licheng@example.edu.cn",
    unit: "计算机学院", address: "杏林校区A栋315",
    content: "老师您好，国家助学贷款回执我已在银行办理，想确认学校这边的提交截止时间。后来已在资助通知里查到说明，这封来信不再需要办理。",
    status: STATUS.pending, level: "一般", dept: "",
    createdAt: d.toISOString(), date: formatDate(d),
    reply: null, rating: null, attachments: [],
    _spec: { stage: STAGE.withdrawn }
  }];
}

/* 李诚未提交的草稿：不走办理流程，学生可在「我的信件」里继续编辑 */
function seedDraft() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(21, 18, 0, 0);
  return {
    id: "XG" + formatDate(d).replace(/-/g, "") + "088",
    mailbox: MOCK.mailbox, owner: "me",
    title: "关于勤工助学岗位时段与晚课冲突的咨询", category: "咨询类", affair: "勤工助学",
    name: "李诚", idInfo: "8201230314", phone: "13874105021", email: "licheng@example.edu.cn",
    unit: "计算机学院", address: "杏林校区A栋315",
    content: "老师您好，我想申请图书馆勤工助学岗位，但目前开放的班次和周二、周四晚课冲突。想先了解岗位班次能否调整，确认后再正式提交。",
    status: STATUS.draft, level: "一般", dept: "",
    createdAt: d.toISOString(), date: formatDate(d),
    reply: null, rating: null, attachments: [], flow: []
  };
}

/* 收尾：学生已催办的演示信件补一条催办记录 */
function finishSeed(l, keep) {
  if (keep.urged && (l.status === STATUS.doing || l.status === STATUS.pending)) sendUrge(l, ["sys", "its"], "student");
  return l;
}

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

  _msgBuffer = [];
  const rot = {};
  const built = seedPending().concat(seedInFlow()).concat(seedLeaderQueues()).concat(seed).concat(seedWithdrawn())
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""))
    .map(r => seedFlow(r, rot));
  built.push(seedDraft());

  /* 演示消息已读状态：每封未办结信件最新一批消息保持未读，其余已读 */
  const latest = {};
  _msgBuffer.forEach(m => { if (!latest[m.letterId] || m.at > latest[m.letterId]) latest[m.letterId] = m.at; });
  const byId = {};
  built.forEach(l => { byId[l.id] = l; });
  _msgBuffer.forEach(m => {
    const l = byId[m.letterId];
    m.read = !(l && l.status !== STATUS.done && m.at === latest[m.letterId]);
  });
  const msgs = _msgBuffer.sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  _msgBuffer = null;
  saveMsgs(msgs);
  saveLetters(built.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
  localStorage.setItem(STORE_KEYS.seedFlag, "1");
}

loadConfig();
seedLetters();
runAutoReminders();
loadFaqs();
