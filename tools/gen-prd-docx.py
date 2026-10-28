#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""由 docs/PRD.md 生成《学工信箱系统 产品需求文档（PRD）》Word 文档。

    python3 tools/gen-prd-docx.py

PRD.md 是唯一事实源；本脚本把它转换为公文风格 docx，改需求只需改 Markdown 后重跑。

支持的 Markdown 子集（覆盖 PRD.md 全部用法）：
  标题 ## / ###、表格（含 \\| 转义与 <br> 换行）、引用块 >、无序/有序列表、
  围栏代码块（mermaid 以源码形式呈现）、行内 **加粗** 与 `等宽`。
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from docx_kit import (Builder, set_run, shade, repeat_header, set_widths,
                      FONT_BODY, FONT_HEAD, FONT_KAI, FONT_WEST,
                      CLR_HEAD_BG, CLR_ACCENT, Pt, Cm, RGBColor,
                      WD_ALIGN_PARAGRAPH, WD_ALIGN_VERTICAL, WD_LINE_SPACING,
                      WD_TABLE_ALIGNMENT, qn)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "PRD.md")
OUT = os.path.join(ROOT, "docs", "学工信箱PRD.docx")

FONT_MONO = "Consolas"
CLR_CODE = RGBColor(0xB0, 0x30, 0x30)
CLR_QUOTE_BG = "F5F7FA"
USABLE_CM = 16.0          # A4 纵向去 2.5cm 边距后的可用宽度
PIPE = "\x00"             # 转义竖线占位符


# ------------------------------------------------------------- 行内富文本

def _emit_code_aware(p, text, size, cn_font, bold, color):
    """按 `等宽` 切分并写入 run；bold / color 由外层加粗上下文决定。"""
    for tk in re.split(r"(`[^`]+`)", text):
        if not tk:
            continue
        if tk.startswith("`") and tk.endswith("`") and len(tk) > 2:
            r = p.add_run(tk[1:-1])
            r.font.name = FONT_MONO
            r.font.size = Pt(size - 0.5)
            r.bold = bold
            r._element.rPr.rFonts.set(qn("w:eastAsia"), cn_font)
            r.font.color.rgb = color if color is not None else CLR_CODE
        else:
            set_run(p.add_run(tk), cn_font, size, bold, color)


def add_rich(p, text, size=12, cn_font=FONT_BODY, base_bold=False, color=None):
    """把 **加粗** 与 `等宽` 解析为多个 run 写入段落，支持二者嵌套。"""
    text = text.replace(PIPE, "|").replace("<br>", "\n").replace("<br/>", "\n")
    for tk in re.split(r"(\*\*[^*]+\*\*)", text):
        if not tk:
            continue
        if tk.startswith("**") and tk.endswith("**") and len(tk) > 4:
            _emit_code_aware(p, tk[2:-2], size, cn_font, True, color)
        else:
            _emit_code_aware(p, tk, size, cn_font, base_bold, color)


def rich_cell(cell, text, size=9, bold=False, align="left"):
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = cell.paragraphs[0]
    p.alignment = {"center": WD_ALIGN_PARAGRAPH.CENTER,
                   "left": WD_ALIGN_PARAGRAPH.LEFT}[align]
    pf = p.paragraph_format
    pf.space_before = Pt(1.5)
    pf.space_after = Pt(1.5)
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    add_rich(p, text, size=size, base_bold=bold,
             color=CLR_ACCENT if bold else None)


# ------------------------------------------------------------- Markdown 解析

def split_row(line):
    """拆分表格行，保护 \\| 转义。"""
    cells = line.replace("\\|", PIPE).strip().strip("|").split("|")
    return [c.strip() for c in cells]


def plain_len(text):
    """估算显示宽度：中文按 2、其余按 1，忽略 markdown 标记。"""
    t = re.sub(r"\*\*|`", "", text.replace(PIPE, "|"))
    return sum(2 if "\u4e00" <= ch <= "\u9fff" or ch in "，。、；：（）「」【】" else 1
               for ch in t)


def parse(md):
    """把 Markdown 解析为块序列 [(type, payload), ...]。"""
    lines = md.split("\n")
    blocks, i, n = [], 0, len(lines)
    while i < n:
        line = lines[i]
        # 围栏代码块
        if line.startswith("```"):
            lang = line[3:].strip()
            buf, i = [], i + 1
            while i < n and not lines[i].startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            blocks.append(("code", (lang, "\n".join(buf))))
            continue
        # 表格
        if line.startswith("|"):
            rows, i = [], i
            while i < n and lines[i].startswith("|"):
                rows.append(lines[i])
                i += 1
            header = split_row(rows[0])
            body = [split_row(r) for r in rows[2:]] if len(rows) > 2 else []
            blocks.append(("table", (header, body)))
            continue
        # 引用块（连续 > 行合并）
        if line.startswith(">"):
            buf = []
            while i < n and lines[i].startswith(">"):
                buf.append(lines[i].lstrip(">").strip())
                i += 1
            blocks.append(("quote", "\n".join(x for x in buf if x)))
            continue
        # 标题
        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            blocks.append(("h", (len(m.group(1)), m.group(2).strip())))
            i += 1
            continue
        # 列表
        m = re.match(r"^[-*]\s+(.*)$", line)
        if m:
            blocks.append(("ul", m.group(1)))
            i += 1
            continue
        m = re.match(r"^(\d+)\.\s+(.*)$", line)
        if m:
            blocks.append(("ol", (m.group(1), m.group(2))))
            i += 1
            continue
        # 分隔线
        if re.match(r"^---+$", line.strip()):
            blocks.append(("hr", None))
            i += 1
            continue
        # 正文
        if line.strip():
            blocks.append(("p", line.strip()))
        i += 1
    return blocks


# ------------------------------------------------------------- 渲染

def col_widths(header, body, total=USABLE_CM):
    """按各列内容长度加权分配列宽，并设下限避免过窄。"""
    ncol = len(header)
    weights = []
    for c in range(ncol):
        vals = [plain_len(header[c])] + [plain_len(r[c]) for r in body if c < len(r)]
        avg = sum(vals) / len(vals)
        mx = max(vals)
        weights.append((avg * 2 + mx) ** 0.5)   # 抑制极端长列
    s = sum(weights)
    raw = [total * w / s for w in weights]
    floor = 1.5 if ncol <= 6 else 1.2
    out = [max(w, floor) for w in raw]
    scale = total / sum(out)
    return [w * scale for w in out]


def table_font(ncol):
    return {1: 10.5, 2: 10.5, 3: 10, 4: 9.5, 5: 9.5, 6: 9}.get(ncol, 8)


def render_table(b, header, body):
    ncol = len(header)
    size = table_font(ncol)
    t = b.doc.add_table(rows=1, cols=ncol)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(header):
        c = t.rows[0].cells[i]
        rich_cell(c, h, size=size, bold=True, align="center")
        shade(c, CLR_HEAD_BG)
    repeat_header(t.rows[0])
    for row in body:
        cells = t.add_row().cells
        for i in range(ncol):
            val = row[i] if i < len(row) else ""
            # 首列多为编号/字段名，居中更整齐；其余左对齐便于阅读长文本
            align = "center" if (i == 0 and plain_len(val) <= 12) else "left"
            rich_cell(cells[i], val, size=size, align=align)
    set_widths(t, col_widths(header, body))
    b.doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


def render_code(b, lang, code):
    label = {"mermaid": "流程图源码（Mermaid 语法，可用支持 Mermaid 的工具渲染为图形）"}.get(
        lang, f"代码块（{lang}）" if lang else "代码块")
    p = b.doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    set_run(p.add_run(label), FONT_KAI, 9.5, color=RGBColor(0x77, 0x77, 0x77))
    t = b.doc.add_table(rows=1, cols=1)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = t.rows[0].cells[0]
    shade(cell, CLR_QUOTE_BG)
    first = True
    for ln in code.split("\n"):
        p = cell.paragraphs[0] if first else cell.add_paragraph()
        first = False
        pf = p.paragraph_format
        pf.space_before = Pt(0)
        pf.space_after = Pt(0)
        pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
        r = p.add_run(ln if ln.strip() else " ")
        r.font.name = FONT_MONO
        r.font.size = Pt(8.5)
        r._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_BODY)
    set_widths(t, [USABLE_CM])
    b.doc.add_paragraph().paragraph_format.space_after = Pt(2)


def render_quote(b, text):
    t = b.doc.add_table(rows=1, cols=1)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = t.rows[0].cells[0]
    shade(cell, CLR_QUOTE_BG)
    first = True
    for ln in text.split("\n"):
        p = cell.paragraphs[0] if first else cell.add_paragraph()
        first = False
        pf = p.paragraph_format
        pf.space_before = Pt(2)
        pf.space_after = Pt(2)
        pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
        add_rich(p, ln, size=10.5, cn_font=FONT_KAI)
    set_widths(t, [USABLE_CM])
    b.doc.add_paragraph().paragraph_format.space_after = Pt(2)


def render(b, blocks):
    doc_title = None
    for kind, payload in blocks:
        if kind == "h":
            level, text = payload
            if level == 1:
                doc_title = text
                continue
            # Markdown 的 ## → Word 一级标题，### → 二级，#### → 三级
            # 标题会进入目录域，去掉行内标记符号只保留文字
            b.h(re.sub(r"\*\*|`", "", text), min(level - 1, 3))
        elif kind == "p":
            p = b.doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.first_line_indent = Pt(24)
            add_rich(p, payload, size=12)
        elif kind == "ul":
            p = b.doc.add_paragraph(style="List Bullet")
            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
            p.paragraph_format.space_after = Pt(2)
            add_rich(p, payload, size=11)
        elif kind == "ol":
            num, text = payload
            p = b.doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.74)
            p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
            p.paragraph_format.space_after = Pt(2)
            set_run(p.add_run(f"{num}. "), FONT_BODY, 11)
            add_rich(p, text, size=11)
        elif kind == "table":
            render_table(b, *payload)
        elif kind == "code":
            render_code(b, *payload)
        elif kind == "quote":
            render_quote(b, payload)
        # hr 不渲染：Word 中以标题间距区隔
    return doc_title


def meta_of(md, key, default=""):
    m = re.search(r"^\|\s*" + key + r"\s*\|\s*(.+?)\s*\|$", md, re.M)
    return m.group(1) if m else default


def cover(b, title, version, date):
    for text, size, font, bold, space in (
            (title.replace("产品需求文档（PRD）", "").strip() or "学工信箱系统", 22, FONT_HEAD, True, 6),
            ("产品需求文档（PRD）", 18, FONT_HEAD, True, 20)):
        p = b.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(space)
        set_run(p.add_run(text), font, size, bold)
    for line in (f"版　本：{version}", f"日　期：{date}",
                 "状　态：原型阶段", "编制人：产品负责人（占位）",
                 "适用端：PC 桌面端 + 移动端 H5"):
        p = b.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(2)
        set_run(p.add_run(line), FONT_BODY, 11)
    b.blank()
    p = b.doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run(p.add_run("目　　录"), FONT_HEAD, 16, True)
    b.toc()
    b.page_break()


def main():
    md = open(SRC, encoding="utf-8").read()
    version = meta_of(md, "版本", "v2.0")
    date = meta_of(md, "日期", "2026-09")
    blocks = parse(md)
    title = next((t for k, (l, t) in
                  ((k, p) for k, p in blocks if k == "h") if l == 1), "学工信箱系统")

    b = Builder()
    cover(b, title, version, date)
    render(b, blocks)
    b.save(OUT)

    stat = {}
    for k, _ in blocks:
        stat[k] = stat.get(k, 0) + 1
    print(f"源文件 {SRC}")
    print("块统计:", "，".join(f"{k} {v}" for k, v in sorted(stat.items())))


if __name__ == "__main__":
    main()
