import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
from backend.models.user import User

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "generated_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

class NumberedCanvas(canvas.Canvas):
    """Adds professional page numbers and running footer."""
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        footer_text = f"Smart Electricity Demand Prediction & Energy Optimization Platform  |  Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 36, footer_text)
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 48, letter[0] - 54, 48)
        self.restoreState()


class EnergyReportGenerator:
    """
    Synthesizes a production-grade PDF audit and intelligence report
    documenting demand predictions, anomaly diagnostics, efficiency factors,
    and tariff cost analysis.
    """

    def generate_pdf(
        self,
        user: User,
        records: List[Dict[str, Any]],
        latest_prediction: Optional[Dict[str, Any]],
        efficiency: Dict[str, Any],
        cost_analysis: Dict[str, Any],
        anomalies: List[Dict[str, Any]],
        recommendations: List[Dict[str, Any]]
    ) -> str:
        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"Energy_Audit_Report_User_{user.id}_{timestamp_str}.pdf"
        file_path = os.path.join(REPORTS_DIR, filename)

        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            leftMargin=54,
            rightMargin=54,
            topMargin=54,
            bottomMargin=60
        )

        styles = getSampleStyleSheet()

        # Custom typography styles
        primary_color = colors.HexColor("#0f172a") # Slate-900
        accent_color = colors.HexColor("#059669")  # Emerald-600
        text_muted = colors.HexColor("#475569")

        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=primary_color,
            alignment=0,
            spaceAfter=4
        )

        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=accent_color,
            spaceAfter=12
        )

        h2_style = ParagraphStyle(
            "ReportH2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=primary_color,
            spaceBefore=12,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            "ReportBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )

        story = []

        # Header Title
        story.append(Paragraph("SMART ELECTRICITY DEMAND & ENERGY AUDIT REPORT", title_style))
        story.append(Paragraph("Autonomous Predictive Intelligence & Energy Optimization Platform", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#10b981"), spaceAfter=14))

        # Consumer Metadata Table
        user_info_data = [
            [
                Paragraph("<b>Consumer Name:</b> " + user.name, body_style),
                Paragraph("<b>Consumer Type:</b> " + (user.consumer_type.value if hasattr(user.consumer_type, 'value') else str(user.consumer_type)), body_style)
            ],
            [
                Paragraph("<b>Account Email:</b> " + user.email, body_style),
                Paragraph("<b>Monthly Budget:</b> ₹" + f"{user.monthly_budget:,.2f}", body_style)
            ],
            [
                Paragraph("<b>Report Generated:</b> " + datetime.utcnow().strftime("%B %d, %Y %H:%M UTC"), body_style),
                Paragraph("<b>Telemetry Records Evaluated:</b> " + str(len(records)), body_style)
            ]
        ]
        user_table = Table(user_info_data, colWidths=[250, 250])
        user_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(user_table)
        story.append(Spacer(1, 14))

        # Section 1: Executive Intelligence Summary
        story.append(Paragraph("1. Executive Energy Intelligence Summary", h2_style))
        latest_record = records[-1] if records else {}
        curr_units = latest_record.get("units_consumed", 0.0)
        curr_bill = latest_record.get("bill_amount", 0.0)
        pred_units = latest_prediction.get("predicted_demand", 0.0) if latest_prediction else "N/A"
        pred_level = latest_prediction.get("demand_level", "N/A") if latest_prediction else "N/A"
        eff_score = efficiency.get("overall_score", 0)
        eff_cat = efficiency.get("category", "N/A")

        summary_metrics_data = [
            ["Current Consumption", "Forecasted Demand", "Demand Status", "Efficiency Score"],
            [f"{curr_units:.1f} kWh", f"{pred_units} kWh" if isinstance(pred_units, (int, float)) else pred_units, str(pred_level), f"{eff_score} / 100 ({eff_cat})"]
        ]
        sum_table = Table(summary_metrics_data, colWidths=[125, 125, 125, 125])
        sum_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#f1f5f9")),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('PADDING', (0, 0), (-1, -1), 7),
        ]))
        story.append(sum_table)
        story.append(Spacer(1, 14))

        # Section 2: Machine Learning Demand Forecast
        story.append(Paragraph("2. Machine Learning Demand Prediction", h2_style))
        if latest_prediction:
            pred_text = (
                f"<b>Model:</b> {latest_prediction.get('model_name', 'Ridge Regression')} | "
                f"<b>Quality:</b> {latest_prediction.get('prediction_quality', 'Good')} | "
                f"<b>Expected Shift:</b> {latest_prediction.get('percentage_change', 0):+.1f}% vs baseline.<br/>"
                f"<b>Diagnostic Explanation:</b> {latest_prediction.get('explanation', '')}"
            )
            story.append(Paragraph(pred_text, body_style))
            if latest_prediction.get("mae") is not None:
                story.append(Spacer(1, 4))
                metrics_text = f"<i>Evaluation Metrics: MAE = {latest_prediction.get('mae')} kWh, RMSE = {latest_prediction.get('rmse')} kWh, R² = {latest_prediction.get('r2_score')}</i>"
                story.append(Paragraph(metrics_text, body_style))
        else:
            story.append(Paragraph("Insufficient historical cycles recorded to compute an autonomous forecast. Minimum 3 billing periods required.", body_style))
        story.append(Spacer(1, 14))

        # Section 3: Cost Intelligence & Budget Analysis
        story.append(Paragraph("3. Cost Intelligence & Budget Tracking", h2_style))
        c_text = (
            f"<b>Latest Bill:</b> ₹{cost_analysis.get('current_bill', curr_bill):,.2f} | "
            f"<b>Prior Cycle:</b> ₹{cost_analysis.get('previous_bill', 0.0):,.2f} | "
            f"<b>Cost Variance:</b> ₹{cost_analysis.get('cost_difference', 0.0):+,.2f}<br/>"
            f"<b>Budget Assessment:</b> {cost_analysis.get('message', 'Normal operational spending.')}"
        )
        story.append(Paragraph(c_text, body_style))
        story.append(Spacer(1, 14))

        # Section 4: Efficiency Factors Breakdown
        story.append(Paragraph("4. Energy Efficiency Score Breakdown (0–100)", h2_style))
        factors = efficiency.get("factors", [])
        if factors:
            factor_table_rows = [["Factor Dimension", "Weight", "Score Awarded", "Evaluation Insight"]]
            for f in factors:
                factor_table_rows.append([
                    f.get("name", ""),
                    str(f.get("weight", "")),
                    f"{f.get('score', 0):.1f}",
                    Paragraph(f.get("description", ""), body_style)
                ])
            f_table = Table(factor_table_rows, colWidths=[130, 45, 75, 250])
            f_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ('PADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(f_table)
        story.append(Spacer(1, 14))

        # Section 5: Consumption Anomalies
        story.append(Paragraph("5. Consumption Anomaly Diagnostics", h2_style))
        if anomalies:
            anom_rows = [["Anomaly Score", "Severity", "Explanation"]]
            for anom in anomalies[:5]:
                anom_rows.append([
                    f"{anom.get('anomaly_score', 0):.2f}",
                    str(anom.get('severity', 'Normal')),
                    Paragraph(anom.get("explanation", ""), body_style)
                ])
            anom_table = Table(anom_rows, colWidths=[80, 90, 330])
            anom_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ('PADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(anom_table)
        else:
            story.append(Paragraph("Zero statistical or peak anomalies recorded across evaluated consumption logs.", body_style))
        story.append(Spacer(1, 14))

        # Section 6: Actionable Recommendations
        story.append(Paragraph("6. Personalized Energy Optimization Recommendations", h2_style))
        if recommendations:
            for idx, r in enumerate(recommendations[:4], start=1):
                p_color = "#dc2626" if r.get("priority") == "Urgent" else "#ea580c" if r.get("priority") == "High" else "#0284c7"
                rec_html = (
                    f"<b>{idx}. {r.get('title')}</b> "
                    f"<font color='{p_color}'>[{r.get('priority')} Priority]</font><br/>"
                    f"<b>Reason:</b> {r.get('reason')}<br/>"
                    f"<b>Action:</b> {r.get('action')}<br/>"
                    f"<b>Projected Benefit:</b> {r.get('expected_benefit')}"
                )
                story.append(Paragraph(rec_html, body_style))
                story.append(Spacer(1, 6))
        else:
            story.append(Paragraph("No urgent optimization directives required at this time.", body_style))

        # Build document with running footer
        doc.build(story, canvasmaker=NumberedCanvas)
        return file_path

report_generator = EnergyReportGenerator()
