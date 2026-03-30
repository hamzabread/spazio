#!/usr/bin/env python3
"""Generate a clean PDF from the Milestone 3 markdown report."""

import os
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


SOURCE_MD = "PROJECT_REPORT_MILESTONE3_2026-03-24.md"
OUTPUT_PDF = "PROJECT_REPORT_MILESTONE3_2026-03-24.pdf"


def clean_inline_markdown(text: str) -> str:
    """Convert simple markdown syntax to plain text for PDF rendering."""
    text = text.strip()
    if not text:
        return ""

    # Convert [text](url) -> text (url)
    text = re.sub(r"\[([^\]]+)\]\(([^\)]+)\)", r"\1 (\2)", text)

    # Remove emphasis/backticks
    text = text.replace("**", "")
    text = text.replace("__", "")
    text = text.replace("`", "")

    # Escape XML special characters for reportlab Paragraph
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")

    return text


def build_pdf(md_text: str) -> None:
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=A4,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        leftMargin=0.7 * inch,
        rightMargin=0.7 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
        textColor=colors.HexColor("#111827"),
        spaceAfter=10,
    )
    h2_style = ParagraphStyle(
        "H2Style",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1F2937"),
        spaceBefore=8,
        spaceAfter=5,
    )
    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.2,
        leading=12,
        textColor=colors.HexColor("#374151"),
        spaceAfter=4,
    )
    bullet_style = ParagraphStyle(
        "BulletStyle",
        parent=body_style,
        leftIndent=0.18 * inch,
        bulletIndent=0.05 * inch,
        spaceAfter=2,
    )

    story = []
    lines = md_text.splitlines()
    in_code_block = False

    for raw in lines:
        line = raw.rstrip()

        if line.strip().startswith("```"):
            in_code_block = not in_code_block
            continue

        if in_code_block:
            continue

        stripped = line.strip()

        if not stripped:
            story.append(Spacer(1, 0.04 * inch))
            continue

        if stripped == "---":
            story.append(Spacer(1, 0.08 * inch))
            continue

        if stripped.startswith("# "):
            story.append(Paragraph(clean_inline_markdown(stripped[2:]), title_style))
            continue

        if stripped.startswith("## "):
            story.append(Paragraph(clean_inline_markdown(stripped[3:]), h2_style))
            continue

        if re.match(r"^\d+\.\s+", stripped):
            item = re.sub(r"^\d+\.\s+", "", stripped)
            story.append(Paragraph("- " + clean_inline_markdown(item), bullet_style))
            continue

        if stripped.startswith("- ") or stripped.startswith("* "):
            story.append(Paragraph("- " + clean_inline_markdown(stripped[2:]), bullet_style))
            continue

        story.append(Paragraph(clean_inline_markdown(stripped), body_style))

    doc.build(story)


def main() -> int:
    if not os.path.exists(SOURCE_MD):
        print(f"Error: source file not found: {SOURCE_MD}")
        return 1

    with open(SOURCE_MD, "r", encoding="utf-8") as f:
        md_text = f.read()

    build_pdf(md_text)

    size_kb = os.path.getsize(OUTPUT_PDF) / 1024
    print(f"PDF generated: {OUTPUT_PDF} ({size_kb:.1f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
