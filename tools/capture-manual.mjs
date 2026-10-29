/**
 * 为操作手册截取学工信箱 PC / 移动端界面。
 * 用法：node tools/capture-manual.mjs [baseUrl]
 */
import { createRequire } from "module";
const require = createRequire("/Users/yaomaolin/.npm/_npx/bbb8a2c4738e2b0c/node_modules/playwright/package.json");
const { chromium } = require("playwright");
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../docs/manual-assets");
const BASE = process.argv[2] || "http://127.0.0.1:8765";

fs.mkdirSync(OUT, { recursive: true });

const HIDE_PC = `
  .role-switch, .mailbox-switch, .role-badge, .toast { display: none !important; }
`;

async function shot(page, name) {
  const file = path.join(OUT, name + ".png");
  await page.screenshot({ path: file, animations: "disabled" });
  console.log("saved", name);
}

async function pcContext(browser, role, extra) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "zh-CN",
  });
  await ctx.addInitScript((cfg) => {
    localStorage.setItem("xg_role", cfg.role);
    if (cfg.section) localStorage.setItem("xg_section", cfg.section);
    if (cfg.member) localStorage.setItem("xg_member", cfg.member);
  }, { role, ...extra });
  const page = await ctx.newPage();
  await page.goto(BASE + "/index.html#/" + (role === "admin" ? "admin-home" : role === "section" ? "sec-home" : "home"), {
    waitUntil: "networkidle",
  });
  await page.addStyleTag({ content: HIDE_PC + (role === "student" ? "" : "#btn-write-quick{display:none!important}") });
  await page.waitForTimeout(400);
  return { ctx, page };
}

async function go(page, hash) {
  await page.evaluate((h) => { location.hash = "#/" + h; }, hash);
  await page.waitForTimeout(550);
  await page.evaluate(() => document.getElementById("modal")?.classList.remove("show"));
}

async function mobile(browser, role, section, member) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: "zh-CN",
    isMobile: true,
    hasTouch: true,
  });
  await ctx.addInitScript((cfg) => {
    localStorage.setItem("xg_role", cfg.role);
    if (cfg.section) localStorage.setItem("xg_section", cfg.section);
    if (cfg.member) localStorage.setItem("xg_member", cfg.member);
  }, { role, section, member });
  const page = await ctx.newPage();
  const q = new URLSearchParams({ role });
  if (section) q.set("section", section);
  await page.goto(BASE + "/mobile.html?" + q.toString(), { waitUntil: "networkidle" });
  await page.addStyleTag({ content: ".m-topnote,.m-toast{display:none!important}" });
  await page.waitForTimeout(400);
  return { ctx, page };
}

async function mgo(page, route) {
  await page.evaluate((r) => {
    document.getElementById("m-sheet")?.classList.remove("show");
    MApp.go(r);
  }, route);
  await page.waitForTimeout(450);
}

async function hideDemoMore(page) {
  await page.evaluate(() => {
    document.querySelectorAll(".m-section-title").forEach((el) => {
      const t = el.textContent || "";
      if (t.includes("切换身份") || t.includes("选择科室") || t.includes("选择本人")) {
        const n = el.nextElementSibling;
        el.remove();
        if (n) n.remove();
      }
    });
  });
}

const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  /* ---------- 学生 PC ---------- */
  {
    const { ctx, page } = await pcContext(browser, "student");
    await shot(page, "pc-stu-home");
    await go(page, "write-notice");
    await shot(page, "pc-stu-notice");
    await go(page, "write");
    await shot(page, "pc-stu-write");
    await go(page, "my");
    await shot(page, "pc-stu-my");
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll("[data-open]")];
      const done = rows.find((r) => r.innerText.includes("已办结"));
      (done || rows[0])?.click();
    });
    await page.waitForSelector("#modal.show");
    await page.waitForTimeout(300);
    await shot(page, "pc-stu-detail");
    await page.evaluate(() => document.getElementById("modal")?.classList.remove("show"));
    for (const [hash, name] of [
      ["public", "pc-stu-public"],
      ["policy", "pc-stu-policy"],
      ["stats", "pc-stu-stats"],
      ["dept", "pc-stu-dept"],
      ["faq", "pc-stu-faq"],
    ]) {
      await go(page, hash);
      await shot(page, name);
    }
    await ctx.close();
  }

  /* ---------- 科室教师：挑一封「办理中」且已派发到人的信件 ---------- */
  let sec = "学生资助管理科";
  let member = "M402";
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(BASE + "/index.html", { waitUntil: "networkidle" });
    const picked = await page.evaluate(() => {
      const letters = JSON.parse(localStorage.getItem("xg_letters") || "[]");
      const hit = letters.find((l) => l.status === "办理中" && l.assignee && l.assignee.memberId && l.dept);
      return hit ? { section: hit.dept, member: hit.assignee.memberId, name: hit.assignee.name } : null;
    });
    console.log("section identity", picked);
    if (picked) { sec = picked.section; member = picked.member; }
    await ctx.close();
  }

  {
    const { ctx, page } = await pcContext(browser, "section", { section: sec, member });
    await shot(page, "pc-sec-home");
    await go(page, "sec-inbox");
    await shot(page, "pc-sec-inbox");
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "办理");
      (btn || document.querySelector("[data-handle]"))?.click();
    });
    await page.waitForSelector("#modal.show", { timeout: 5000 });
    await page.waitForTimeout(300);
    await shot(page, "pc-sec-reply");
    await ctx.close();
  }

  /* ---------- 综合办 PC ---------- */
  {
    const { ctx, page } = await pcContext(browser, "admin");
    await shot(page, "pc-adm-home");
    await go(page, "dispatch");
    await shot(page, "pc-adm-dispatch");
    await page.evaluate(() => document.querySelector("[data-dispatch]")?.click());
    await page.waitForSelector("#modal.show");
    await page.waitForTimeout(300);
    await shot(page, "pc-adm-dispatch-modal");
    await page.evaluate(() => document.getElementById("modal")?.classList.remove("show"));
    for (const [hash, name] of [
      ["inbox", "pc-adm-inbox"],
      ["supervise", "pc-adm-supervise"],
      ["publish", "pc-adm-publish"],
      ["analytics", "pc-adm-analytics"],
      ["category-mgr", "pc-adm-category"],
      ["section-mgr", "pc-adm-section"],
      ["policy-mgr", "pc-adm-policy"],
      ["sla-mgr", "pc-adm-sla"],
      ["faq-mgr", "pc-adm-faq"],
    ]) {
      await go(page, hash);
      if (hash === "analytics") await page.waitForTimeout(600);
      await shot(page, name);
    }
    await ctx.close();
  }

  /* ---------- 学生移动 ---------- */
  {
    const { ctx, page } = await mobile(browser, "student");
    await shot(page, "m-stu-home");
    await mgo(page, "write-notice");
    await shot(page, "m-stu-notice");
    await mgo(page, "write");
    await shot(page, "m-stu-write");
    await mgo(page, "my");
    await shot(page, "m-stu-my");
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll("[data-letter]")];
      const done = rows.find((r) => r.innerText.includes("已办结"));
      (done || rows[0])?.click();
    });
    await page.waitForSelector("#m-sheet.show");
    await page.waitForTimeout(400);
    await shot(page, "m-stu-detail");
    await mgo(page, "public");
    await shot(page, "m-stu-public");
    await mgo(page, "more");
    await hideDemoMore(page);
    await shot(page, "m-stu-more");
    await ctx.close();
  }

  /* ---------- 科室移动 ---------- */
  {
    const { ctx, page } = await mobile(browser, "section", sec, member);
    await shot(page, "m-sec-home");
    await mgo(page, "sec-inbox");
    await shot(page, "m-sec-inbox");
    await page.evaluate(() => {
      const items = [...document.querySelectorAll("[data-handle]")];
      const mine = items.find((el) => el.innerText.includes("本人"));
      (mine || items[0])?.click();
    });
    await page.waitForSelector("#m-sheet.show");
    await page.waitForTimeout(400);
    await shot(page, "m-sec-reply");
    await ctx.close();
  }

  /* ---------- 综合办移动 ---------- */
  {
    const { ctx, page } = await mobile(browser, "admin");
    await shot(page, "m-adm-home");
    await mgo(page, "dispatch");
    await shot(page, "m-adm-dispatch");
    await page.evaluate(() => document.querySelector("[data-dispatch]")?.click());
    await page.waitForSelector("#m-sheet.show");
    await page.waitForTimeout(400);
    await shot(page, "m-adm-dispatch-sheet");
    await mgo(page, "inbox");
    await shot(page, "m-adm-inbox");
    await mgo(page, "supervise");
    await shot(page, "m-adm-supervise");
    await mgo(page, "more");
    await hideDemoMore(page);
    await shot(page, "m-adm-more");
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log("done");
