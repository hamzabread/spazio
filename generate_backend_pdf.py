#!/usr/bin/env python3
"""
Generate PDF from BACKEND_SETUP_GUIDE.md using reportlab
Creates a professional, formatted PDF with proper styling
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from datetime import datetime
import re

def extract_text(md_file):
    """Extract text from markdown file"""
    with open(md_file, 'r', encoding='utf-8') as f:
        return f.read()

def parse_markdown_to_elements(md_text):
    """Parse markdown and convert to reportlab elements"""
    elements = []
    
    # Get sample styles
    styles = getSampleStyleSheet()
    
    # Define custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=HexColor('#1f2937'),
        spaceAfter=6,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=HexColor('#111827'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold',
        borderColor=HexColor('#3b82f6'),
        borderPadding=5,
    )
    
    subheading_style = ParagraphStyle(
        'CustomH3',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=HexColor('#374151'),
        spaceAfter=8,
        spaceBefore=8,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=HexColor('#374151'),
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        fontName='Helvetica'
    )
    
    code_style = ParagraphStyle(
        'Code',
        parent=styles['BodyText'],
        fontSize=9,
        textColor=HexColor('#1f2937'),
        spaceAfter=6,
        fontName='Courier',
        leftIndent=20,
        backColor=HexColor('#f3f4f6'),
        borderColor=HexColor('#e5e7eb'),
        borderPadding=8,
    )
    
    # Split by lines
    lines = md_text.strip().split('\n')
    in_code_block = False
    code_block = []
    
    for line in lines:
        # Skip empty lines at processing
        if not line.strip():
            if in_code_block:
                code_block.append('')
            else:
                elements.append(Spacer(1, 0.1*inch))
            continue
        
        # Code blocks
        if line.strip().startswith('```'):
            if in_code_block:
                # End code block
                elements.append(Spacer(1, 0.1*inch))
                code_text = '\n'.join(code_block[:100])  # Limit length
                elements.append(Paragraph(code_text.replace('<', '&lt;').replace('>', '&gt;'), code_style))
                elements.append(Spacer(1, 0.15*inch))
                code_block = []
            in_code_block = not in_code_block
            continue
        
        if in_code_block:
            code_block.append(line)
            continue
        
        # Headers
        if line.startswith('# '):
            text = line[2:].strip()
            elements.append(Paragraph(text, title_style))
            elements.append(Spacer(1, 0.2*inch))
        elif line.startswith('## '):
            text = line[3:].strip()
            elements.append(Paragraph(text, heading_style))
        elif line.startswith('### '):
            text = line[4:].strip()
            elements.append(Paragraph(text, subheading_style))
        elif line.startswith('#### '):
            text = line[5:].strip()
            elements.append(Paragraph(text, subheading_style))
        # Lists
        elif line.strip().startswith('- ') or line.strip().startswith('* '):
            text = line.strip()[2:]
            elements.append(Paragraph(f"• {text}", body_style))
        # Page break
        elif line.strip() == '---':
            elements.append(PageBreak())
        # Regular text
        else:
            text = line.strip()
            if text:
                text_clean = text.replace('<', '&lt;').replace('>', '&gt;')
                elements.append(Paragraph(text_clean, body_style))
    
    return elements

def generate_pdf(md_file, output_file):
    """Generate PDF from markdown file"""
    
    # Extract markdown
    md_text = extract_text(md_file)
    
    # Parse to elements
    elements = parse_markdown_to_elements(md_text)
    
    # Create PDF
    doc = SimpleDocTemplate(
        output_file,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch,
        title="Spazio Backend Setup Guide"
    )
    
    # Build PDF
    doc.build(elements)
    
    print(f"✓ PDF generated: {output_file}")
    
    # Get file size
    import os
    size = os.path.getsize(output_file)
    size_kb = size / 1024
    print(f"✓ File size: {size_kb:.1f} KB")

if __name__ == '__main__':
    md_file = 'BACKEND_SETUP_GUIDE.md'
    pdf_file = 'BACKEND_SETUP_GUIDE.pdf'
    
    try:
        generate_pdf(md_file, pdf_file)
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
