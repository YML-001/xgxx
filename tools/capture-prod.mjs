/**
 * 只读截取正式环境学工信箱界面。禁止点击提交、保存、删除、撤回、催办、办结、确认派发等写操作。
 * 账号口令从环境变量读取：XG_PW
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire("/Users/yaomaolin/.npm/_npx/bbb8a2c4738e2b0c/node_modules/playwright/package.json");
const { chromium } = require("playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../docs/manual-assets/prod");
fs.mkdirSync(OUT, { recursive: true });

const PW = process.env.XG_PW;
const PC = "https://zhxg.csu.edu.cn/znzhxgpt_web/#/newlogin";
if (!PW) {
  console.error("missing XG_PW");
  process.exit(1);
}

const notes = [];

function log(s) {
  console.log(s);
  notes.push(s);
}

async function shot(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".el-notification__closeBtn").click({ timeout: 800 }).catch(() => {});
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, name + ".png") });
  const text = await page.evaluate(() => document.body.innerText.replace(/\n{2,}/g, "\n").slice(0, 900));
  fs.writeFileSync(path.join(OUT, name + ".txt"), text);
  log("saved " + name + " " + page.url());
}

async function login(page, user) {
  await page.goto(PC, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('input[placeholder="请输入学号/ 工号"]', { timeout: 20000 });
  await page.fill('input[placeholder="请输入学号/ 工号"]', user);
  await page.fill('input[placeholder="请输入密码"]', PW);
  await page.click('button:has-text("登录")');
  await page.waitForTimeout(3200);
}

async function enterXg(page) {
  if (await page.locator(".service-card__enter").count()) {
    const btns = page.locator(".service-card.card-01 button.service-card__enter");
    const n = await btns.count();
    for (let i = 0; i < n; i++) {
      const box = await btns.nth(i).boundingBox();
      if (box && box.x > 60 && box.x < 1500 && box.width > 40 && box.y > 0 && box.y < 880) {
        await btns.nth(i).click();
        break;
      }
    }
    await page.waitForTimeout(3500);
  }
  const nav = page.getByText("学工信箱", { exact: true });
  if (await nav.count()) {
    await nav.first().click();
    await page.waitForTimeout(2200);
  }
  await page.locator(".el-notification__closeBtn").click({ timeout: 1200 }).catch(() => {});
}

async function switchRole(page, roleName) {
  const cur = page.locator("span.fs12").first();
  if (!(await cur.count())) return;
  await cur.click();
  await page.waitForTimeout(600);
  const opt = page.locator("span.flex_c", { hasText: roleName });
  if (await opt.count()) {
    await opt.first().click();
    await page.waitForTimeout(2500);
    log("switched role " + roleName + " -> " + page.url());
    if (!page.url().includes("/xgxx/")) {
      const nav = page.getByText("学工信箱", { exact: true });
      if (await nav.count()) {
        await nav.first().click();
        await page.waitForTimeout(2000);
      }
    }
  } else {
    log("role not found " + roleName);
    await page.keyboard.press("Escape");
  }
}

async function clickMenu(page, name) {
  const items = page.locator(".menu_item");
  const n = await items.count();
  for (let i = 0; i < n; i++) {
    const raw = (await items.nth(i).innerText()).replace(/\s+/g, "");
    if (raw === name || raw.startsWith(name)) {
      await items.nth(i).click();
      await page.waitForTimeout(1400);
      await page.locator(".el-notification__closeBtn").click({ timeout: 600 }).catch(() => {});
      return true;
    }
  }
  log("MENU MISS " + name);
  return false;
}

const browser = await chromium.launch({ channel: "chrome", headless: true });

/* 登录页（不填密码） */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "zh-CN" });
  const page = await ctx.newPage();
  await page.goto(PC, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('input[placeholder="请输入学号/ 工号"]');
  await page.waitForTimeout(800);
  await shot(page, "pc-login");
  await ctx.close();
}

/* 学生 */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "zh-CN" });
  const page = await ctx.newPage();
  await login(page, "8209250713");
  await shot(page, "pc-system");
  await enterXg(page);
  const menus = ["工作台", "我的信件", "我要写信", "信件查询", "数据统计", "公开信件", "制度文件", "科室联系方式", "常见问题"];
  const files = ["pc-stu-home", "pc-stu-my", "pc-stu-write", "pc-stu-query", "pc-stu-stats", "pc-stu-public", "pc-stu-policy", "pc-stu-dept", "pc-stu-faq"];
  for (let i = 0; i < menus.length; i++) {
    if (await clickMenu(page, menus[i])) await shot(page, files[i]);
  }
  /* 只读打开一封已办结信件详情：点标题区域，避开按钮 */
  if (await clickMenu(page, "我的信件")) {
    const opened = await page.evaluate(() => {
      const bad = /提交|保存|删除|撤回|催办|办结|派发|确认|评价|二次/;
      const nodes = [...document.querySelectorAll("tr, .letter-item, .list-item, .card, a, div")];
      const row = nodes.find((el) => {
        const t = (el.innerText || "").trim();
        return t.includes("XG") && t.length < 400 && el.querySelectorAll("button").length < 6 && !bad.test(el.innerText.slice(0, 20));
      });
      if (!row) return "";
      const title = row.querySelector(".title, .ellipsis_1, td") || row;
      title.click();
      return (row.innerText || "").slice(0, 80);
    });
    log("detail click " + opened);
    await page.waitForTimeout(1200);
    await shot(page, "pc-stu-detail");
  }
  await ctx.close();
}

/* 科室 220118 */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "zh-CN" });
  const page = await ctx.newPage();
  await login(page, "220118");
  await enterXg(page);
  if (await clickMenu(page, "科室工作台")) await shot(page, "pc-sec-home");
  if (await clickMenu(page, "科室收件箱")) await shot(page, "pc-sec-inbox");
  const opened = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button, span, a, div")].find((el) => {
      const t = (el.innerText || "").trim();
      return (t === "查看" || t === "办理" || t === "详情") && el.children.length === 0;
    });
    if (!btn) return "no-view-btn";
    if (/办结|提交|删除|撤回|催办|派发|确认/.test(btn.innerText)) return "skip";
    btn.click();
    return btn.innerText;
  });
  log("sec open " + opened);
  await page.waitForTimeout(1200);
  if (opened && opened !== "no-view-btn" && opened !== "skip") await shot(page, "pc-sec-reply");
  await ctx.close();
}

/* 综合办 220106，切到综合办管理员后只读浏览 */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "zh-CN" });
  const page = await ctx.newPage();
  await login(page, "220106");
  await enterXg(page);
  await switchRole(page, "综合办管理员");
  const pairs = [
    ["办理工作台", "pc-adm-home"],
    ["待分派信件", "pc-adm-dispatch"],
    ["信件收件箱", "pc-adm-inbox"],
    ["督办催办", "pc-adm-supervise"],
    ["来信选登管理", "pc-adm-publish"],
    ["统计分析", "pc-adm-analytics"],
    ["分类管理", "pc-adm-category"],
    ["科室管理", "pc-adm-section"],
    ["制度文件管理", "pc-adm-policy"],
    ["超期与催办配置", "pc-adm-sla"],
    ["常见问题配置", "pc-adm-faq"],
  ];
  for (const [menu, file] of pairs) {
    if (await clickMenu(page, menu)) await shot(page, file);
  }
  /* 派发弹窗：只打开不确认 */
  if (await clickMenu(page, "待分派信件")) {
    const clicked = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button, span, a")].find((el) => (el.innerText || "").trim() === "派发" && el.children.length === 0);
      if (!btn) return "no";
      btn.click();
      return "yes";
    });
    log("dispatch click " + clicked);
    await page.waitForTimeout(1000);
    const danger = await page.evaluate(() => /派发成功|已派发至/.test(document.body.innerText));
    if (danger) log("WARNING dispatch may have submitted");
    else if (clicked === "yes") await shot(page, "pc-adm-dispatch-modal");
    await page.keyboard.press("Escape");
    await page.locator(".el-dialog__headerbtn, .el-dialog__close").first().click({ timeout: 800 }).catch(() => {});
  }
  await ctx.close();
}

fs.writeFileSync(path.join(OUT, "_log.txt"), notes.join("\n"));
await browser.close();
console.log("PC DONE");
