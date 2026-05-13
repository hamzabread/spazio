#!/usr/bin/env python3
import os
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

SOURCE_MD = "GHOST_LOCAL_AND_THEME_INTERACTION.md"
OUTPUT_PDF = "GHOST_LOCAL_AND_THEME_INTERACTION.pdf"


def clean(text: str) -> str:
    text = text.strip()
    text = re.sub(r"\[([^\]]+)\]\(([^\)]+)\)", r"\1 (\2)", text)
    text = text.replace("**", "").replace("__", "").replace("`", "")
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return text


def build(md: str) -> None:
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=A4,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        leftMargin=0.7 * inch,
        rightMargin=0.7 * inch,
    )
    styles = getSampleStyleSheet()
    title = ParagraphStyle("T", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=colors.HexColor("#111827"), spaceAfter=10)
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=colors.HexColor("#1F2937"), spaceBefore=8, spaceAfter=5)
    body = ParagraphStyle("B", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.2, leading=12, textColor=colors.HexColor("#374151"), spaceAfter=4)
    bullet = ParagraphStyle("BL", parent=body, leftIndent=0.18 * inch, bulletIndent=0.05 * inch, spaceAfter=2)

    story = []
    for raw in md.splitlines():
        s = raw.strip()
        if not s:
            story.append(Spacer(1, 0.04 * inch))
            continue
        if s.startswith("# "):
            story.append(Paragraph(clean(s[2:]), title))
        elif s.startswith("## ") or s.startswith("### "):
            story.append(Paragraph(clean(s.split(" ", 1)[1]), h2))
        elif s.startswith("- "):
            story.append(Paragraph("- " + clean(s[2:]), bullet))
        else:
            story.append(Paragraph(clean(s), body))

    doc.build(story)


def main() -> int:
    if not os.path.exists(SOURCE_MD):
        print(f"Missing file: {SOURCE_MD}")
        return 1
    with open(SOURCE_MD, "r", encoding="utf-8") as f:
        md = f.read()
    build(md)
    print(f"Generated {OUTPUT_PDF}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
