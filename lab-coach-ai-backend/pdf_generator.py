import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def _escape_html(text: str) -> str:
    return (
        str(text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _paragraphs_from_body(body: str, body_style):
    blocks = []
    for chunk in str(body or "").split("\n\n"):
        chunk = chunk.strip()
        if not chunk:
            continue
        safe = _escape_html(chunk).replace("\n", "<br/>")
        blocks.append(Paragraph(safe, body_style))
    return blocks


def build_cyber_coaching_pdf(
    recipient_name: str,
    suite_num: str,
    drive_link: str,
    plan_data: dict,
    filename: str = "Biomechanical_Lab_Report.pdf",
):
    """Generate a professional lab report from unified 5-card dossier data."""
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    story = []

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        textColor=colors.HexColor("#1A202C"),
        spaceAfter=12,
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=16,
        spaceAfter=8,
        leading=14,
    )

    body_style = ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1F2937"),
    )

    story.append(Paragraph("LIFE LONGEVITY LAB REPORT", title_style))
    story.append(
        Paragraph(
            f"<b>Recipient:</b> {_escape_html(recipient_name)} &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"<b>Suite:</b> {_escape_html(suite_num)}",
            body_style,
        )
    )
    if drive_link:
        story.append(
            Paragraph(
                f"<b>Video Cloud Telemetry:</b> <a href='{_escape_html(drive_link)}'>{_escape_html(drive_link)}</a>",
                body_style,
            )
        )
    story.append(Spacer(1, 18))

    unified_cards = plan_data.get("unified_cards") if isinstance(plan_data, dict) else None

    if unified_cards:
        for index, card in enumerate(unified_cards, start=1):
            title = card.get("title") or f"Section {index}"
            body = card.get("body") or ""
            story.append(
                Paragraph(
                    f"{index:02d} // {_escape_html(title)}",
                    section_heading,
                )
            )
            if body.strip():
                story.extend(_paragraphs_from_body(body, body_style))
            else:
                story.append(Paragraph("—", body_style))
            story.append(Spacer(1, 10))
    else:
        # Legacy fallback for older payloads
        story.append(Paragraph("CLINICAL ASSESSMENT SUMMARY", section_heading))
        story.extend(
            _paragraphs_from_body(plan_data.get("gideon_assessment_summary", ""), body_style)
        )

    doc.build(story)
    return filename
