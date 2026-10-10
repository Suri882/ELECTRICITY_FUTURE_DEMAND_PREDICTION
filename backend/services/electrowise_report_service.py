import os
import csv
import io
from datetime import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "generated_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

class ElectroWiseNumberedCanvas(canvas.Canvas):
    """Adds professional running header, page numbers and legal disclaimer footer."""
    def __init__(self, *args, **kwargs):
        super(ElectroWiseNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_elements(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_elements(self, page_count):
        self.saveState()
        # Top banner line
        self.setStrokeColor(colors.HexColor("#10b981"))
        self.setLineWidth(2)
        self.line(54, letter[1] - 40, letter[0] - 54, letter[1] - 40)

        # Header watermark text
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0f766e"))
        self.drawString(54, letter[1] - 34, "ELECTROWISE | SMART ENERGY DEMAND, CONSTRUCTION & COST INTELLIGENCE")

        # Bottom footer
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        footer_text = f"ElectroWise Energy Intelligence Platform  |  Audit ID: EW-{datetime.utcnow().strftime('%Y%m%d%H%M')}  |  Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 30, footer_text)
        self.drawString(54, 30, "CONFIDENTIAL & PRELIMINARY PLANNING ESTIMATE")
        
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 42, letter[0] - 54, 42)
        self.restoreState()


class ElectroWiseReportService:
    """
    Synthesizes executive engineering and financial audit reports for ElectroWise projects.
    Includes facility parameters, construction electricity budgets, equipment inventory,
    tariff itemization, solar & storage sizing, EV analysis, and actionable recommendations.
    """

    def generate_project_pdf(
        self,
        project_data: Dict[str, Any],
        scenario_data: Dict[str, Any],
        construction_calc_data: Dict[str, Any],
        tariff_data: Dict[str, Any],
        solar_data: Optional[Dict[str, Any]] = None,
        ev_data: Optional[Dict[str, Any]] = None,
        recommendations: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_proj_name = "".join(c for c in project_data.get("name", "Project") if c.isalnum() or c in (' ', '_')).rstrip()
        filename = f"ElectroWise_Audit_{safe_proj_name.replace(' ', '_')}_{timestamp}.pdf"
        file_path = os.path.join(REPORTS_DIR, filename)

        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            leftMargin=54,
            rightMargin=54,
            topMargin=54,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0f172a")
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#047857")
        )
        h2_style = ParagraphStyle(
            "H2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=15,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=12,
            spaceAfter=4
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#334155")
        )
        table_text = ParagraphStyle(
            "TableText",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#1e293b")
        )
        table_header = ParagraphStyle(
            "TableHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.white
        )

        elements = []

        # Document Header
        elements.append(Spacer(1, 4))
        elements.append(Paragraph("ELECTROWISE ENERGY AUDIT & PLANNING REPORT", title_style))
        elements.append(Paragraph(f"Project: {project_data.get('name')} | Facility: {project_data.get('facility_subtype')} ({project_data.get('facility_category')})", subtitle_style))
        elements.append(Spacer(1, 10))

        # Project Summary Table
        proj_meta = [
            [
                Paragraph("<b>Location:</b>", table_text), Paragraph(f"{project_data.get('location')}, {project_data.get('state')}", table_text),
                Paragraph("<b>Project Phase:</b>", table_text), Paragraph(str(project_data.get('project_phase')), table_text)
            ],
            [
                Paragraph("<b>Built-up Area:</b>", table_text), Paragraph(f"{project_data.get('built_up_area')} {project_data.get('area_unit')} ({project_data.get('floors_count')} Floors)", table_text),
                Paragraph("<b>Connection Type:</b>", table_text), Paragraph(str(project_data.get('connection_type')), table_text)
            ],
            [
                Paragraph("<b>Occupancy:</b>", table_text), Paragraph(f"{project_data.get('occupancy')} Persons", table_text),
                Paragraph("<b>DISCOM & Tariff:</b>", table_text), Paragraph(f"{project_data.get('discom')} - {project_data.get('tariff_category')}", table_text)
            ],
            [
                Paragraph("<b>Report Generated:</b>", table_text), Paragraph(datetime.utcnow().strftime("%d %b %Y, %H:%M UTC"), table_text),
                Paragraph("<b>Active Scenario:</b>", table_text), Paragraph(str(scenario_data.get('name', 'Baseline')), table_text)
            ]
        ]
        meta_table = Table(proj_meta, colWidths=[100, 160, 100, 144])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 12))

        # Executive Metrics Cards Table
        eq_sum = scenario_data.get("equipment_summary", {}).get("summary", {})
        const_sum = construction_calc_data.get("summary", {})
        bill_sum = tariff_data
        
        exec_metrics = [
            [
                Paragraph("<b>ESTIMATED MONTHLY DEMAND</b>", table_text),
                Paragraph("<b>ESTIMATED MONTHLY BILL</b>", table_text),
                Paragraph("<b>OPERATIONAL PEAK DEMAND</b>", table_text),
                Paragraph("<b>CONSTRUCTION ELEC. BUDGET</b>", table_text)
            ],
            [
                Paragraph(f"<font size='11' color='#0f766e'><b>{eq_sum.get('total_monthly_kwh', 0):,.1f} kWh</b></font>", table_text),
                Paragraph(f"<font size='11' color='#0f766e'><b>₹{bill_sum.get('total_estimated_monthly_bill', 0):,.2f}</b></font>", table_text),
                Paragraph(f"<font size='11' color='#0f766e'><b>{eq_sum.get('total_operational_peak_kw', 0):,.1f} kW</b></font>", table_text),
                Paragraph(f"<font size='11' color='#0f766e'><b>₹{const_sum.get('total_construction_budget_inr', 0):,.2f}</b></font>", table_text)
            ]
        ]
        exec_table = Table(exec_metrics, colWidths=[126, 126, 126, 126])
        exec_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#ecfdf5")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#059669")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        elements.append(exec_table)
        elements.append(Spacer(1, 12))

        # Section 1: Construction Electricity Phase Analysis
        elements.append(Paragraph("1. Construction-Phase Electricity Budget & Sizing", h2_style))
        const_rows = [
            [
                Paragraph("Phase", table_header),
                Paragraph("Machines", table_header),
                Paragraph("Duration", table_header),
                Paragraph("Total kWh", table_header),
                Paragraph("Cost (₹)", table_header)
            ]
        ]
        for ph in construction_calc_data.get("phases", [])[:6]:
            const_rows.append([
                Paragraph(ph.get("phase_name", ""), table_text),
                Paragraph(str(ph.get("equipment_count", 1)), table_text),
                Paragraph(f"{ph.get('duration_months', 1)} mo", table_text),
                Paragraph(f"{ph.get('total_kwh', 0):,.1f}", table_text),
                Paragraph(f"₹{ph.get('total_cost', 0):,.2f}", table_text),
            ])
        const_table = Table(const_rows, colWidths=[160, 60, 70, 100, 114])
        const_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(const_table)

        # Suggested Temporary Sizing Notice
        sizing_note = (
            f"<b>Temporary Connection Sizing:</b> Connected Load: {const_sum.get('total_connected_load_kw', 0)} kW | "
            f"Max Simultaneous Demand (65% Diversity): {const_sum.get('estimated_max_simultaneous_demand_kw', 0)} kW | "
            f"<b>Suggested Temporary Connection: {const_sum.get('suggested_connection_capacity_kva', 0)} kVA</b>."
        )
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(sizing_note, body_style))
        elements.append(Spacer(1, 10))

        # Section 2: Operational Equipment Inventory & Consumption
        elements.append(Paragraph("2. Operational Electrical Equipment & Appliance Inventory", h2_style))
        eq_rows = [
            [
                Paragraph("Equipment Name", table_header),
                Paragraph("Qty", table_header),
                Paragraph("Rated Power", table_header),
                Paragraph("Hours/Day", table_header),
                Paragraph("Monthly kWh", table_header),
                Paragraph("Share", table_header)
            ]
        ]
        items_ranking = scenario_data.get("equipment_summary", {}).get("equipment_ranking", [])
        for item in items_ranking[:10]:
            eq_rows.append([
                Paragraph(item.get("name", ""), table_text),
                Paragraph(str(item.get("quantity", 1)), table_text),
                Paragraph(f"{item.get('rated_power_w', 0)} W", table_text),
                Paragraph(f"{item.get('daily_hours', 0)} hrs", table_text),
                Paragraph(f"{item.get('monthly_kwh', 0):,.1f}", table_text),
                Paragraph(f"{item.get('consumption_share_pct', 0)}%", table_text)
            ])
        eq_table = Table(eq_rows, colWidths=[164, 40, 70, 60, 90, 80])
        eq_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(eq_table)
        elements.append(Spacer(1, 10))

        # Section 3: Tariff & Slab Billing Breakdown
        elements.append(Paragraph("3. Electricity Tariff Slab Breakdown", h2_style))
        tariff_rows = [
            [
                Paragraph("Slab Range", table_header),
                Paragraph("Units Billed (kWh)", table_header),
                Paragraph("Rate (₹/kWh)", table_header),
                Paragraph("Energy Charge (₹)", table_header)
            ]
        ]
        for slab in tariff_data.get("slab_breakdown", []):
            tariff_rows.append([
                Paragraph(slab.get("slab_range", ""), table_text),
                Paragraph(str(slab.get("units", 0)), table_text),
                Paragraph(f"₹{slab.get('rate_per_kwh', 0):.2f}", table_text),
                Paragraph(f"₹{slab.get('charge_amount', 0):.2f}", table_text)
            ])
        tariff_table = Table(tariff_rows, colWidths=[144, 120, 120, 120])
        tariff_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(tariff_table)

        bill_meta_note = (
            f"<b>Effective Cost:</b> ₹{tariff_data.get('effective_rate_per_kwh', 0):.2f} / kWh | "
            f"Fixed Charges: ₹{tariff_data.get('fixed_charges', 0):.2f} | "
            f"Taxes ({tariff_data.get('tax_percentage', 0)}%): ₹{tariff_data.get('tax_amount', 0):.2f} | "
            f"<b>Total Bill: ₹{tariff_data.get('total_estimated_monthly_bill', 0):,.2f}</b>"
        )
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(bill_meta_note, body_style))
        elements.append(Spacer(1, 10))

        # Section 4: Solar & Clean Energy Assessment (if available)
        if solar_data:
            elements.append(Paragraph("4. Solar PV & Battery Storage Assessment", h2_style))
            solar_sz = solar_data.get("solar_sizing", {})
            bess_sz = solar_data.get("battery_storage_sizing", {})
            solar_summary_text = (
                f"Suggested Solar Capacity: <b>{solar_sz.get('suggested_solar_capacity_kw', 0)} kW</b> | "
                f"Expected Daily Clean Generation: <b>{solar_sz.get('expected_daily_generation_kwh', 0)} kWh</b> | "
                f"Annual Generation: <b>{solar_sz.get('expected_annual_generation_kwh', 0):,.0f} kWh</b><br/>"
                f"Battery Sizing for Critical Backup: <b>{bess_sz.get('suggested_battery_capacity_kwh', 0)} kWh</b> ({bess_sz.get('battery_amp_hours_48v', 0)} Ah @ 48V) | "
                f"Annual CO2 Reduction: <b>{solar_sz.get('annual_co2_offset_tonnes', 0)} Tonnes</b>"
            )
            elements.append(Paragraph(solar_summary_text, body_style))
            elements.append(Spacer(1, 10))

        # Section 5: Smart Energy Efficiency Recommendations
        if recommendations:
            elements.append(Paragraph("5. Priority Energy Optimization Actions", h2_style))
            rec_rows = [
                [
                    Paragraph("Action Title", table_header),
                    Paragraph("Category", table_header),
                    Paragraph("Monthly Savings", table_header),
                    Paragraph("Payback", table_header)
                ]
            ]
            for r in recommendations[:5]:
                rec_rows.append([
                    Paragraph(r.get("title", ""), table_text),
                    Paragraph(r.get("category", ""), table_text),
                    Paragraph(f"₹{r.get('money_saved_monthly_inr', 0):,.2f} ({r.get('units_saved_monthly_kwh', 0)} kWh)", table_text),
                    Paragraph(f"{r.get('payback_period_months', 0)} mo", table_text)
                ])
            rec_table = Table(rec_rows, colWidths=[204, 100, 120, 80])
            rec_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#065f46")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]))
            elements.append(rec_table)
            elements.append(Spacer(1, 12))

        # Formal Disclaimer
        disclaimer = (
            "<b>LEGAL & ENGINEERING DISCLAIMER:</b> This ElectroWise Energy Audit Report is an automated engineering projection "
            "synthesized from operational schedules, equipment duty ratings, and DISCOM tariff guidelines. "
            "Actual kilowatt-hour consumption varies with climate, power factor, user behavior, and grid fluctuations. "
            "Equipment sizing and service capacity must be validated by a certified Electrical Inspector / Licensed Engineer."
        )
        elements.append(Paragraph(disclaimer, ParagraphStyle("Disc", parent=body_style, fontSize=7, leading=9, textColor=colors.HexColor("#64748b"))))

        doc.build(elements, canvasmaker=ElectroWiseNumberedCanvas)
        return file_path

    def export_equipment_csv(self, equipment_list: List[Dict[str, Any]]) -> str:
        """Exports equipment inventory to CSV format."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Category", "Equipment Name", "Brand/Model", "Quantity",
            "Rated Power (Watts)", "Operating Load %", "Daily Hours",
            "Monthly Days", "Efficiency %", "Unit Purchase Cost (INR)",
            "Total Purchase Cost (INR)", "Daily kWh", "Monthly kWh",
            "Annual kWh", "Estimated Monthly Cost (INR)"
        ])
        for eq in equipment_list:
            writer.writerow([
                eq.get("category", ""),
                eq.get("name", ""),
                eq.get("brand_model", ""),
                eq.get("quantity", 1),
                eq.get("rated_power_w", 0),
                eq.get("operating_load_pct", 70),
                eq.get("daily_hours", 8),
                eq.get("monthly_days", 30),
                eq.get("efficiency_pct", 90),
                eq.get("unit_purchase_cost", 0),
                eq.get("total_purchase_cost", 0),
                eq.get("daily_kwh", 0),
                eq.get("monthly_kwh", 0),
                eq.get("annual_kwh", 0),
                eq.get("monthly_cost", 0)
            ])
        return output.getvalue()

electrowise_report_service = ElectroWiseReportService()
