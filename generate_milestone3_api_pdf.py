#!/usr/bin/env python3
"""
Generate PDF from MILESTONE3_API_REQUIREMENTS.md using reportlab
Creates a professional, formatted PDF with proper styling
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
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
        fontSize=20,
        textColor=HexColor('#1f2937'),
        spaceAfter=6,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=HexColor('#6b7280'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    heading_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=HexColor('#111827'),
        spaceAfter=10,
        spaceBefore=10,
        fontName='Helvetica-Bold',
        borderColor=HexColor('#3b82f6'),
        borderPadding=4,
    )
    
    subheading_style = ParagraphStyle(
        'CustomH3',
        parent=styles['Heading3'],
        fontSize=11,
        textColor=HexColor('#374151'),
        spaceAfter=6,
        spaceBefore=6,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=9.5,
        textColor=HexColor('#374151'),
        spaceAfter=6,
        alignment=TA_JUSTIFY,
        fontName='Helvetica'
    )
    
    code_style = ParagraphStyle(
        'Code',
        parent=styles['BodyText'],
        fontSize=8,
        textColor=HexColor('#1f2937'),
        spaceAfter=4,
        fontName='Courier',
        leftIndent=15,
        backColor=HexColor('#f3f4f6'),
        borderColor=HexColor('#e5e7eb'),
        borderPadding=6,
    )
    
    list_style = ParagraphStyle(
        'ListStyle',
        parent=styles['BodyText'],
        fontSize=9.5,
        textColor=HexColor('#374151'),
        spaceAfter=4,
        leftIndent=20,
        fontName='Helvetica'
    )
    
    # Split by lines
    lines = md_text.strip().split('\n')
    in_code_block = False
    in_table = False
    code_block = []
    table_rows = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Table detection
        if '|' in line and not in_code_block:
            if not in_table:
                in_table = True
                table_rows = []
            
            # Parse table row
            if line.strip().startswith('|'):
                cells = [cell.strip() for cell in line.split('|')[1:-1]]
                table_rows.append(cells)
            
            # Check if table ends
            if i + 1 < len(lines) and ('|' not in lines[i + 1] or lines[i + 1].strip() == ''):
                if table_rows:
                    try:
                        table = Table(table_rows, colWidths=[1.5*inch]*len(table_rows[0]))
                        table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#e5e7eb')),
                            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#1f2937')),
                            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('FONTSIZE', (0, 0), (-1, -1), 8),
                            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#d1d5db')),
                        ]))
                        elements.append(table)
                        elements.append(Spacer(1, 0.15*inch))
                    except:
                        pass
                in_table = False
                table_rows = []
            
            i += 1
            continue
        
        # Skip empty lines
        if not line.strip():
            if not in_code_block and not in_table:
                elements.append(Spacer(1, 0.08*inch))
            i += 1
            continue
        
        # Code blocks
        if line.strip().startswith('```'):
            if in_code_block:
                # End code block
                if code_block:
                    code_text = '\n'.join(code_block[:80])
                    code_text_escaped = code_text.replace('<', '&lt;').replace('>', '&gt;')
                    elements.append(Paragraph(code_text_escaped, code_style))
                    elements.append(Spacer(1, 0.1*inch))
                code_block = []
            in_code_block = not in_code_block
            i += 1
            continue
        
        if in_code_block:
            code_block.append(line)
            i += 1
            continue
        
        # Headers
        if line.startswith('# '):
            text = line[2:].strip()
            elements.append(Paragraph(text, title_style))
            elements.append(Spacer(1, 0.1*inch))
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
            elements.append(Paragraph(f"• {text}", list_style))
        # Page break
        elif line.strip() == '---':
            elements.append(PageBreak())
        # Regular text
        else:
            text = line.strip()
            if text and not text.startswith('|'):
                text_clean = text.replace('<', '&lt;').replace('>', '&gt;')
                elements.append(Paragraph(text_clean, body_style))
        
        i += 1
    
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
        rightMargin=0.6*inch,
        leftMargin=0.6*inch,
        topMargin=0.6*inch,
        bottomMargin=0.6*inch,
        title="Spazio Milestone 3 - API Requirements"
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
    md_file = 'MILESTONE3_API_REQUIREMENTS.md'
    pdf_file = 'MILESTONE3_API_REQUIREMENTS.pdf'
    
    try:
        generate_pdf(md_file, pdf_file)
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
