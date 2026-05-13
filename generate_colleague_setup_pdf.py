#!/usr/bin/env python3
import os
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, Preformatted, SimpleDocTemplate, Spacer

SOURCE_MD = "COLLEAGUE_LOCAL_SETUP.md"
OUTPUT_PDF = "COLLEAGUE_LOCAL_SETUP.pdf"


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
    title = ParagraphStyle(
        "T",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
        textColor=colors.HexColor("#111827"),
        spaceAfter=10,
    )
    h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1F2937"),
        spaceBefore=8,
        spaceAfter=5,
    )
    body = ParagraphStyle(
        "B",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.2,
        leading=12,
        textColor=colors.HexColor("#374151"),
        spaceAfter=4,
    )
    bullet = ParagraphStyle(
        "BL", parent=body, leftIndent=0.18 * inch, bulletIndent=0.05 * inch, spaceAfter=2
    )

    story = []
    in_code = False
    code_lines: list[str] = []

    def flush_code() -> None:
        nonlocal code_lines
        if not code_lines:
            return
        block = "\n".join(code_lines)
        story.append(
            Preformatted(
                block,
                ParagraphStyle(
                    "code",
                    parent=styles["Code"],
                    fontName="Courier",
                    fontSize=7.8,
                    leading=9.5,
                    leftIndent=0.1 * inch,
                    textColor=colors.HexColor("#111827"),
                ),
            )
        )
        story.append(Spacer(1, 0.06 * inch))
        code_lines = []

    for raw in md.splitlines():
        s = raw.rstrip("\n")
        stripped = s.strip()
        if stripped.startswith("```"):
            if in_code:
                flush_code()
            in_code = not in_code
            continue
        if in_code:
            code_lines.append(s)
            continue
        if not stripped:
            story.append(Spacer(1, 0.04 * inch))
            continue
        if stripped == "---":
            story.append(Spacer(1, 0.08 * inch))
            continue
        if stripped.startswith("# "):
            story.append(Paragraph(clean(stripped[2:]), title))
        elif stripped.startswith("## ") or stripped.startswith("### "):
            story.append(Paragraph(clean(stripped.split(" ", 1)[1]), h2))
        elif stripped.startswith("- "):
            story.append(Paragraph("- " + clean(stripped[2:]), bullet))
        else:
            story.append(Paragraph(clean(stripped), body))

    if in_code:
        flush_code()

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
