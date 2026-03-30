from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

SRC = Path("PROJECT_REPORT_2026-03-24.md")
OUT = Path("PROJECT_REPORT_2026-03-24.pdf")


def draw_wrapped_line(pdf: canvas.Canvas, text: str, x: float, y: float, max_width: float, line_height: float):
    words = text.split(" ")
    if not words:
        return y - line_height

    current = words[0]
    for word in words[1:]:
        candidate = current + " " + word
        if pdf.stringWidth(candidate, "Helvetica", 11) <= max_width:
            current = candidate
        else:
            pdf.drawString(x, y, current)
            y -= line_height
            current = word
    pdf.drawString(x, y, current)
    y -= line_height
    return y


def main():
    if not SRC.exists():
        raise FileNotFoundError(f"Missing source markdown: {SRC}")

    lines = SRC.read_text(encoding="utf-8").splitlines()

    pdf = canvas.Canvas(str(OUT), pagesize=A4)
    width, height = A4
    left = 18 * mm
    right = width - 18 * mm
    top = height - 18 * mm
    bottom = 16 * mm
    line_height = 5.2 * mm

    y = top
    in_code_block = False

    for raw in lines:
        line = raw.rstrip("\n")

        if line.startswith("```"):
            in_code_block = not in_code_block
            continue

        if y < bottom:
            pdf.showPage()
            pdf.setFont("Helvetica", 11)
            y = top

        if not line:
            y -= line_height * 0.6
            continue

        if line.startswith("# "):
            pdf.setFont("Helvetica-Bold", 16)
            y = draw_wrapped_line(pdf, line[2:], left, y, right - left, line_height * 1.05)
            pdf.setFont("Helvetica", 11)
            continue

        if line.startswith("## "):
            pdf.setFont("Helvetica-Bold", 13)
            y = draw_wrapped_line(pdf, line[3:], left, y, right - left, line_height)
            pdf.setFont("Helvetica", 11)
            continue

        if in_code_block:
            pdf.setFont("Courier", 9)
            y = draw_wrapped_line(pdf, line, left, y, right - left, line_height * 0.9)
            pdf.setFont("Helvetica", 11)
            continue

        y = draw_wrapped_line(pdf, line, left, y, right - left, line_height)

    pdf.save()
    print(f"Generated {OUT.resolve()}")


if __name__ == "__main__":
    main()
