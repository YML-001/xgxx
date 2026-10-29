#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""绘制学工信箱办理流程图，供建设方案和修改清单嵌入。"""

import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "docs", "manual-assets", "mailbox-flow.png",
)

W, H = 1400, 2200
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

COLLECTED = []


def font(size):
    for path in (
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size, index=0)
            except Exception:
                return ImageFont.truetype(path, size)
    return ImageFont.load_default()


F_TITLE = font(42)
F_BOX = font(32)
F_SMALL = font(28)
F_TAG = font(24)


def remember(text):
    COLLECTED.append(text)
    return text


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


def text_height(draw, text, fnt, max_w, gap):
    lines = wrap(draw, text, fnt, max_w)
    heights = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line or " ", font=fnt)
        heights.append(bbox[3] - bbox[1])
    total = sum(heights) + gap * (len(lines) - 1 if len(lines) > 1 else 0)
    return lines, heights, total


def text_block(draw, xy, text, fnt, fill, max_w, gap=8):
    lines, heights, total = text_height(draw, text, fnt, max_w, gap)
    x, y = xy
    cy = y
    for line, h in zip(lines, heights):
        tw = draw.textlength(line, font=fnt) if line else 0
        draw.text((x + (max_w - tw) / 2, cy), line, font=fnt, fill=fill)
        cy += h + gap
    return total


def rounded(draw, box, radius, fill, outline, width=3):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def arrow(draw, x1, y1, x2, y2, color=LINE):
    draw.line((x1, y1, x2, y2), fill=color, width=3)
    if abs(x2 - x1) >= abs(y2 - y1):
        sign = 1 if x2 > x1 else -1
        pts = [(x2, y2), (x2 - sign * 14, y2 - 7), (x2 - sign * 14, y2 + 7)]
    else:
        sign = 1 if y2 > y1 else -1
        pts = [(x2, y2), (x2 - 7, y2 - sign * 14), (x2 + 7, y2 - sign * 14)]
    draw.polygon(pts, fill=color)


def draw_box(draw, x, y, w, text, fill, stroke, fnt):
    max_w = w - 36
    _, _, total = text_height(draw, text, fnt, max_w, 8)
    h = max(78, int(total + 28))
    rounded(draw, (x, y, x + w, y + h), 16, fill, stroke, 3)
    text_block(draw, (x + 18, y + (h - total) / 2), text, fnt, INK, max_w)
    return h


def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    title = remember("学工信箱办理流程")
    d.text((40, 28), title, font=F_TITLE, fill=NAVY)
    sub = remember(
        "综合办指定负责科室，分派给科室负责人。\n"
        "负责人可自己写，也可同时指定科室回复人与学院协同。\n"
        "稿件回到负责人后，提交分管领导审批；通过后由负责人确认回复学生。"
    )
    sub_h = text_block(d, (40, 86), sub, F_TAG, MUTED, 900, gap=6)

    left_x, left_w = 36, 780
    right_x, right_w = 860, 500
    y = 86 + sub_h + 28

    steps_before = [
        (remember("1  学生提交来信\n只存草稿不进入办理"), BLUE_F, NAVY, F_BOX),
        (remember("2  立即发送 7 日收悉回执\n不是正式答复，状态仍为待分派"), BLUE_F, NAVY, F_SMALL),
        (remember("3  综合办指定负责科室\n分派给该科室的科室负责人\n不自动推荐科室\n不直接指定科室回复人\n也不直接分给分管领导"), BLUE_F, NAVY, F_SMALL),
    ]
    for text, fill, stroke, fnt in steps_before:
        h = draw_box(d, left_x, y, left_w, text, fill, stroke, fnt)
        y += h
        arrow(d, left_x + left_w / 2, y, left_x + left_w / 2, y + 28)
        y += 28

    y4 = y
    middle = [
        (remember("4  科室负责人办理\n可自己写答复\n可指定科室回复人起草\n可发起学院协同\n后两项可以同时进行"), GOLD_F, GOLD_S, F_SMALL),
        (remember("5  回复稿回到科室负责人\n自己写的由本人确认\n回复人交回，或学院意见发回\n仍由负责人确认后提交"), BLUE_F, NAVY, F_SMALL),
        (remember("6  科室负责人提交\n科室分管领导审批"), GOLD_F, GOLD_S, F_BOX),
        (remember("7  通过后不自动发送\n分管领导不能改完直接发\n负责人确认回复学生\n并选择公开范围"), GREEN_F, GREEN_S, F_SMALL),
    ]
    for i, (text, fill, stroke, fnt) in enumerate(middle):
        h = draw_box(d, left_x, y, left_w, text, fill, stroke, fnt)
        y += h
        if i < len(middle) - 1:
            arrow(d, left_x + left_w / 2, y, left_x + left_w / 2, y + 26)
            y += 26
    y_after = y

    side = remember(
        "可同时进行\n\n"
        "科室回复人只起草\n"
        "写完交回科室负责人\n"
        "不能提交审批\n"
        "不能直接回复学生\n\n"
        "学院副书记线下承办\n"
        "处理意见发回负责人\n"
        "不能对学生办结\n"
        "承办不是系统审批\n\n"
        "审批不通过时\n"
        "退回科室负责人并附意见\n"
        "负责人可自己修改\n"
        "或再交科室回复人修改\n"
        "然后再次提交审批"
    )
    pad = 22
    inner_w = right_w - pad * 2
    _, _, side_total = text_height(d, side, F_SMALL, inner_w, 8)
    side_h = side_total + pad * 2
    span = y_after - y4
    if side_h > span:
        raise SystemExit("右侧说明高于主流程，需要 %s，现有 %s" % (side_h, span))
    top = y4 + (span - side_h) / 2
    rounded(d, (right_x, top, right_x + right_w, top + side_h), 16, WHITE, PURPLE_S, 3)
    text_block(d, (right_x + pad, top + pad), side, F_SMALL, INK, inner_w)
    arrow(d, left_x + left_w, y4 + 48, right_x, top + 36, PURPLE_S)

    y = y_after
    arrow(d, left_x + left_w / 2, y, left_x + left_w / 2, y + 28)
    y += 28
    end_text = remember("8  学生收到正式答复，信件办结\n学生始终能看到自己的答复")
    h = draw_box(d, left_x, y, left_w, end_text, GREEN_F, GREEN_S, F_BOX)
    y += h + 18
    foot = remember("公开范围只有两种：全部公开，或仅该学院副书记可见。")
    d.text((left_x, y), foot, font=F_TAG, fill=MUTED)
    y += 40

    blob = "\n".join(COLLECTED)
    for word in ("学办主任", "分案", "科室领导", "待指定回复人"):
        if word in blob:
            raise SystemExit("流程图含禁用词：" + word)
    for word in ("科室负责人", "科室回复人", "科室分管领导", "可以同时", "指定负责科室"):
        if word not in blob:
            raise SystemExit("流程图缺少：" + word)

    cropped = img.crop((0, 0, W, min(H, int(y + 24))))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    cropped.save(OUT, "PNG")
    print(OUT, cropped.size)


if __name__ == "__main__":
    main()
