import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def build_cyber_coaching_pdf(recipient_name: str, suite_num: str, drive_link: str, plan_data: dict, filename: str = "Biomechanical_Lab_Report.pdf"):
    """
    Generates a clean, professional lab report using your Gemini structured data.
    """
    # 1. Setup Document Template
    doc = SimpleDocTemplate(filename, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    
    # 2. Setup Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor("#1A202C"), # Clean Slate Gray
        spaceAfter=12
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor("#4B5563"), # Subdued Dark Gray
        spaceBefore=14,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#374151")
    )

    # 3. Add Document Header
    story.append(Paragraph("LIFE LONGEVITY LAB REPORT", title_style))
    story.append(Paragraph(f"<b>Recipient:</b> {recipient_name} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Suite:</b> {suite_num}", body_style))
    if drive_link:
        story.append(Paragraph(f"<b>Video Cloud Telemetry:</b> <a href='{drive_link}'>{drive_link}</a>", body_style))
    story.append(Spacer(1, 15))
    
    # 4. Add Gideon Clinical Summary
    story.append(Paragraph("CLINICAL ASSESSMENT SUMMARY", section_heading))
    story.append(Paragraph(plan_data.get('gideon_assessment_summary', ''), body_style))
    story.append(Spacer(1, 10))
    
    # 5. Helper — render tier lines (new schema) or legacy strategy blocks
    def add_tier_lines(title, items):
        if not items:
            return
        story.append(Paragraph(title, section_heading))
        if isinstance(items, str):
            items = [items]
        for line in items:
            if line:
                story.append(Paragraph(f"• {line}", body_style))
        story.append(Spacer(1, 8))

    def legacy_block_to_lines(block_dict):
        if not block_dict or not isinstance(block_dict, dict):
            return []
        lines = []
        if block_dict.get("phase_objective"):
            lines.append(block_dict["phase_objective"])
        for key in (
            "weekly_mobility_directives",
            "weekly_strength_stability_directives",
            "weekly_mindfulness_breathwork",
        ):
            for item in block_dict.get(key) or []:
                if item:
                    lines.append(str(item))
        return lines

    def format_protocol_block(block):
        if isinstance(block, str):
            return [block] if block.strip() else []
        if isinstance(block, list):
            return [str(x) for x in block if x]
        if isinstance(block, dict):
            lines = []
            schedule = block.get("day_by_day_schedule") or block.get("schedule_overview")
            if schedule:
                lines.append(f"Schedule: {schedule}")
            for label, key in (
                ("Stretching & Mobility", "stretching_mobility_layout"),
                ("Massage & Soft Tissue", "massage_soft_tissue_plan"),
                ("Daily Life Health Tips", "daily_life_health_tips"),
            ):
                if block.get(key):
                    lines.append(f"{label}: {block[key]}")
            return lines
        return []

    def get_tier(key, legacy_key=None):
        val = plan_data.get(key)
        if isinstance(val, dict):
            return format_protocol_block(val)
        if val:
            return val if isinstance(val, list) else [str(val)]
        if legacy_key:
            return legacy_block_to_lines(plan_data.get(legacy_key, {}))
        return []

    add_tier_lines("RIGHT NOW ADJUSTMENT", plan_data.get("right_now_adjustment"))
    add_tier_lines("2-WEEK PROTOCOL", get_tier("two_week_protocol", "two_week_activation_strategy"))
    add_tier_lines("4-WEEK PROTOCOL", get_tier("four_week_protocol", "four_week_adaptation_strategy"))
    somatic = plan_data.get("somatic_health_tips") or plan_data.get("long_term_vision")
    add_tier_lines("SOMATIC HEALTH & LONG-TERM VISION", somatic)

    benchmarks = plan_data.get("retesting_comparison_benchmarks", {})
    if benchmarks:
        story.append(Paragraph("FUTURE RETESTING BENCHMARKS", section_heading))
        table_data = [["Metric / Movement Vector", "Target Goal Objective"]]
        for metric, goal in benchmarks.items():
            table_data.append([str(metric).replace("_", " ").title(), str(goal)])
        bench_table = Table(table_data, colWidths=[200, 340])
        bench_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F3F4F6")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#1F2937")),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E5E7EB")),
            ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(bench_table)

    # Build the document file
    doc.build(story)
    return filename
