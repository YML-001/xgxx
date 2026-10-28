#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""绘制学工信箱调整后的业务流程图。"""

import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "docs", "manual-assets", "mailbox-flow.png")

W, H = 1680, 1680
NAVY = (31, 92, 153)
INK = (30, 41, 59)
MUTED = (71, 85, 105)
LINE = (51, 65, 85)
BLUE_F = (232, 242, 250)
GOLD_F = (255, 246, 230)
GOLD_S = (180, 110, 20)
GREEN_F = (232, 245, 236)
GREEN_S = (30, 130, 70)
RED_F = (253, 236, 236)
RED_S = (176, 48, 48)
PURPLE_F = (243, 236, 250)
PURPLE_S = (106, 64, 150)
WHITE = (255, 255, 255)
BG = (248, 250, 252)


def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            index = 0
            try:
                return ImageFont.truetype(path, size, index=index)
            except Exception:
                return ImageFont.truetype(path, size)
    return ImageFont.load_default()


F_TITLE = font(36)
F_BOX = font(26)
F_SMALL = font(22)
F_TAG = font(20)


def wrap(draw, text, fnt, max_w):
    lines = []
    for para in text.split("\n"):
        cur = ""
        if para == "":
            lines.append("")
            continue
        for ch in para:
            trial = cur + ch
            if draw.textlength(trial, font=fnt) <= max_w:
                cur = trial
            else:
                if cur:
                    lines.append(cur)
                cur = ch
        if cur:
            lines.append(cur)
    return lines or [""]


def rounded(draw, box, radius, fill, outline, width=3):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text_block(draw, xy, text, fnt, fill, max_w, align="center", line_gap=8):
    lines = wrap(draw, text, fnt, max_w)
    x, y = xy
    heights = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=fnt)
        heights.append(bbox[3] - bbox[1])
    total = sum(heights) + line_gap * (len(lines) - 1)
    cy = y
    for line, h in zip(lines, heights):
        tw = draw.textlength(line, font=fnt)
        tx = x + (max_w - tw) / 2 if align == "center" else x
        draw.text((tx, cy), line, font=fnt, fill=fill)
        cy += h + line_gap
    return total


def arrow(draw, x1, y1, x2, y2, color=LINE):
    draw.line((x1, y1, x2, y2), fill=color, width=3)
    # arrow head
    if abs(x2 - x1) >= abs(y2 - y1):
        sign = 1 if x2 > x1 else -1
        pts = [(x2, y2), (x2 - sign * 14, y2 - 7), (x2 - sign * 14, y2 + 7)]
    else:
        sign = 1 if y2 > y1 else -1
        pts = [(x2, y2), (x2 - 7, y2 - sign * 14), (x2 + 7, y2 - sign * 14)]
    draw.polygon(pts, fill=color)


def label(draw, x, y, text, fill=MUTED):
    tw = draw.textlength(text, font=F_TAG)
    draw.text((x - tw / 2, y), text, font=F_TAG, fill=fill)


def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((80, 36), "学工信箱办理流程", font=F_TITLE, fill=NAVY)
    d.text((80, 88), "学生提交后 7 天内正式回复　·　全部信件均须科室领导审批　·　不按问题类型推荐科室",
           font=F_SMALL, fill=MUTED)

    # main column boxes
    mx, mw = 70, 760

    def box(y, h, text, fill, stroke, fnt=F_BOX):
        rounded(d, (mx, y, mx + mw, y + h), 16, fill, stroke, 3)
        text_block(d, (mx + 24, y + 16), text, fnt, INK, mw - 48)
        return y + h

    def down(y, length=36):
        arrow(d, mx + mw / 2, y, mx + mw / 2, y + length)
        return y + length

    def cbox(gx, gw, cy, h, text):
        max_w = gw - 80
        lines = wrap(d, text, F_SMALL, max_w)
        line_gap = 8
        heights = []
        for line in lines:
            bbox = d.textbbox((0, 0), line, font=F_SMALL)
            heights.append(bbox[3] - bbox[1])
        total = sum(heights) + line_gap * (len(lines) - 1 if len(lines) > 1 else 0)
        if total + 24 > h:
            raise SystemExit(f"学院协同文字超出方框（需要{total + 24:.0f}，现有{h}）：{text}")
        rounded(d, (gx + 24, cy, gx + gw - 24, cy + h), 14, PURPLE_F, PURPLE_S, 3)
        text_block(d, (gx + 40, cy + (h - total) / 2), text, F_SMALL, INK, max_w)
        return cy + h

    y = 140
    y = box(y, 72, "1  学生提交来信", BLUE_F, NAVY)
    y = down(y, 28)
    y = box(y, 96, "2  系统立即回执：已收到，7 天内正式回复，感谢反馈。仍为待分派，不算办结。", BLUE_F, NAVY, F_SMALL)
    y = down(y, 28)
    y = box(y, 96, "3  综合办人工指定科室领导（科长）。不按问题类型自动推荐科室。", BLUE_F, NAVY, F_SMALL)
    y = down(y, 28)
    y = box(y, 88, "4  科室领导指定具体回复人，之后也由同一人审批答复", BLUE_F, NAVY, F_SMALL)
    y = down(y, 28)

    dy = y
    rounded(d, (mx + 70, dy, mx + mw - 70, dy + 84), 18, GOLD_F, GOLD_S, 3)
    text_block(d, (mx + 90, dy + 22), "5  回复人能否直接拟写答复？", F_BOX, INK, mw - 180)

    gx, gw, gh = 900, 720, 430
    gy = dy
    rounded(d, (gx, gy, gx + gw, gy + gh), 18, WHITE, PURPLE_S, 3)
    d.text((gx + 24, gy + 16), "不能直接拟写：学院协同", font=F_BOX, fill=PURPLE_S)
    cy = gy + 62
    cy = cbox(gx, gw, cy, 70, "直接发给学院副书记")
    arrow(d, gx + gw / 2, cy, gx + gw / 2, cy + 20, PURPLE_S)
    cy += 20
    cy = cbox(
        gx, gw, cy, 96,
        "副书记指定人员线下承办，承办结果回到副书记。\n线下承办不作为系统审批环节。",
    )
    arrow(d, gx + gw / 2, cy, gx + gw / 2, cy + 20, PURPLE_S)
    cy += 20
    cy = cbox(gx, gw, cy, 76, "副书记写处理意见后，发回科室回复人编辑")
    if cy > gy + gh - 48:
        raise SystemExit(f"学院协同方框与回箭头过近：bottom={cy - gy:.0f}, limit={gh - 48}")

    arrow(d, mx + mw - 70, dy + 42, gx, dy + 42, PURPLE_S)
    label(d, (mx + mw + gx) / 2 - 10, dy + 10, "不能")

    edit_top = gy + gh - 78
    arrow(d, mx + mw / 2, dy + 84, mx + mw / 2, edit_top, LINE)
    label(d, mx + mw / 2 - 28, dy + 92, "能")
    y = box(edit_top, 78, "6  回复人编辑答复内容", BLUE_F, NAVY)
    arrow(d, gx + 28, gy + gh - 40, mx + mw, edit_top + 39, PURPLE_S)
    y = down(y, 28)
    y = box(y, 88, "7  提交科室领导审批。所有信件都要审，简单回复也不例外。", GOLD_F, GOLD_S, F_SMALL)
    y = down(y, 26)

    dec_y = y
    rounded(d, (mx + 70, dec_y, mx + mw - 70, dec_y + 84), 18, GOLD_F, GOLD_S, 3)
    text_block(d, (mx + 90, dec_y + 22), "8  科室领导是否通过？", F_BOX, INK, mw - 180)
    y = dec_y + 84
    y = down(y, 26)
    label(d, mx + mw / 2 - 36, y - 24, "通过")

    rx = 900
    rounded(d, (rx, dec_y, rx + 720, dec_y + 130), 16, RED_F, RED_S, 3)
    text_block(d, (rx + 24, dec_y + 28), "不通过：打回回复人。回复人按修改意见编辑后，再次提交科室领导审批。通过前不发给学生。", F_SMALL, INK, 672)
    arrow(d, mx + mw - 70, dec_y + 42, rx, dec_y + 42, RED_S)
    label(d, (mx + mw + rx) / 2 - 30, dec_y + 8, "不通过")

    y = box(y, 88, "9  审批通过后不直接发送。回复人再确认一次，然后正式回复。", GREEN_F, GREEN_S, F_SMALL)
    y = down(y, 28)
    y = box(y, 72, "10  学生收到正式答复，信件办结", GREEN_F, GREEN_S)
    y = down(y, 28)
    end_y = box(y, 96, "11  科室选择公开范围：全部公开，或仅该学院副书记可见。", BLUE_F, NAVY, F_SMALL)
    # crop unused canvas
    cropped = img.crop((0, 0, W, min(H, end_y + 48)))
    cropped.save(OUT, "PNG")
    print(OUT, cropped.size)
    return

    img.save(OUT, "PNG")
    print(OUT)


if __name__ == "__main__":
    main()
