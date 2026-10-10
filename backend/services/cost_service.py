from typing import List, Dict, Any, Optional
from backend.config import settings
from backend.schemas.analytics_schema import CostAnalysisResponse

class CostIntelligenceService:
    """
    Performs cost breakdown, comparative bill analysis,
    tariff calculation, and transparent electricity bill estimation.
    """

    def __init__(
        self,
        base_rate: float = settings.BASE_TARIFF_RATE,
        peak_multiplier: float = settings.PEAK_TARIFF_MULTIPLIER,
        tax_pct: float = settings.TAX_PERCENTAGE
    ):
        self.base_rate = base_rate
        self.peak_multiplier = peak_multiplier
        self.tax_pct = tax_pct

    def calculate_estimated_cost(
        self,
        units: float,
        peak_units: float = 0.0,
        custom_base_rate: Optional[float] = None,
        custom_peak_multiplier: Optional[float] = None,
        custom_tax_pct: Optional[float] = None,
        fixed_charge: float = 0.0
    ) -> float:
        """
        Calculates estimated cost based on configurable tariff structure:
        Regular Units * Base Rate + Peak Units * (Base Rate * Multiplier) + Fixed Charges + Taxes
        """
        base = custom_base_rate if custom_base_rate is not None else self.base_rate
        mult = custom_peak_multiplier if custom_peak_multiplier is not None else self.peak_multiplier
        tax = custom_tax_pct if custom_tax_pct is not None else self.tax_pct

        regular_units = max(0.0, units - peak_units)
        energy_subtotal = (regular_units * base) + (peak_units * (base * mult))
        subtotal = energy_subtotal + fixed_charge
        total_with_tax = subtotal * (1 + (tax / 100.0))
        return round(total_with_tax, 2)

    def generate_bill_estimate(
        self,
        consumption_kwh: float,
        peak_kwh: float = 0.0,
        base_rate: Optional[float] = None,
        peak_multiplier: Optional[float] = None,
        fixed_charges: float = 120.0,
        tax_pct: Optional[float] = None,
        period_label: str = "Next 30 Days (Cycle)",
        previous_bill: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Produces an itemized, transparent electricity bill estimate
        with documented assumptions and official disclaimer.
        """
        rate = base_rate if base_rate is not None else self.base_rate
        mult = peak_multiplier if peak_multiplier is not None else self.peak_multiplier
        tax = tax_pct if tax_pct is not None else self.tax_pct

        regular_kwh = max(0.0, consumption_kwh - peak_kwh)
        base_energy_cost = round(regular_kwh * rate, 2)
        peak_energy_cost = round(peak_kwh * (rate * mult), 2)
        energy_subtotal = round(base_energy_cost + peak_energy_cost, 2)
        subtotal_before_tax = round(energy_subtotal + fixed_charges, 2)
        tax_amount = round(subtotal_before_tax * (tax / 100.0), 2)
        total_estimate = round(subtotal_before_tax + tax_amount, 2)

        effective_rate = round(total_estimate / (consumption_kwh + 1e-5), 2)

        # Period comparison
        comparison = None
        if previous_bill is not None:
            diff = round(total_estimate - previous_bill, 2)
            pct = round((diff / (previous_bill + 1e-5)) * 100, 1)
            comparison = {
                "previous_cycle_bill": round(previous_bill, 2),
                "difference_amount": diff,
                "percentage_change": pct,
                "direction": "higher" if diff > 0 else "lower"
            }

        return {
            "disclaimer": "OFFICIAL ESTIMATE NOTICE: This calculation is a deterministic simulation based on user-provided and default tariffs. It is NOT an official utility board billing invoice.",
            "period_label": period_label,
            "consumption_kwh": round(consumption_kwh, 2),
            "regular_kwh": round(regular_kwh, 2),
            "peak_kwh": round(peak_kwh, 2),
            "itemized_breakdown": {
                "base_energy_charges": base_energy_cost,
                "peak_surcharge_charges": peak_energy_cost,
                "fixed_service_charges": round(fixed_charges, 2),
                "electricity_tax_duty": tax_amount,
                "subtotal": subtotal_before_tax
            },
            "total_estimated_bill": total_estimate,
            "effective_rate_per_kwh": effective_rate,
            "assumptions_applied": {
                "base_tariff_rate_inr_per_kwh": rate,
                "peak_multiplier": mult,
                "fixed_monthly_charges": fixed_charges,
                "tax_percentage": tax
            },
            "period_comparison": comparison
        }

    def analyze_cost(
        self,
        records: List[Dict[str, Any]],
        monthly_budget: float = 0.0
    ) -> CostAnalysisResponse:
        if not records:
            return CostAnalysisResponse(
                current_bill=0.0,
                previous_bill=0.0,
                cost_difference=0.0,
                consumption_difference=0.0,
                monthly_budget=monthly_budget,
                is_budget_exceeded=False,
                budget_usage_percent=0.0,
                message="No billing records available for cost analysis."
            )

        current_record = records[-1]
        current_bill = float(current_record.get("bill_amount", 0.0))
        current_units = float(current_record.get("units_consumed", 0.0))

        if len(records) >= 2:
            prev_record = records[-2]
            prev_bill = float(prev_record.get("bill_amount", 0.0))
            prev_units = float(prev_record.get("units_consumed", 0.0))
        else:
            prev_bill = current_bill
            prev_units = current_units

        cost_diff = round(current_bill - prev_bill, 2)
        consumption_diff = round(current_units - prev_units, 2)

        is_exceeded = (monthly_budget > 0) and (current_bill > monthly_budget)
        usage_pct = round((current_bill / monthly_budget) * 100, 1) if monthly_budget > 0 else 0.0

        if is_exceeded:
            message = (
                f"Your electricity bill (₹{current_bill:,.2f}) exceeded your set monthly budget "
                f"(₹{monthly_budget:,.2f}) by ₹{current_bill - monthly_budget:,.2f}."
            )
        elif monthly_budget > 0 and usage_pct >= 85:
            message = (
                f"Your estimated electricity cost is approaching your budget limit "
                f"({usage_pct}% of ₹{monthly_budget:,.2f} utilized)."
            )
        else:
            diff_text = f"+₹{cost_diff:,.2f}" if cost_diff >= 0 else f"-₹{abs(cost_diff):,.2f}"
            message = f"Current bill is ₹{current_bill:,.2f} ({diff_text} compared to previous cycle)."

        return CostAnalysisResponse(
            current_bill=round(current_bill, 2),
            previous_bill=round(prev_bill, 2),
            cost_difference=cost_diff,
            consumption_difference=consumption_diff,
            monthly_budget=monthly_budget,
            is_budget_exceeded=is_exceeded,
            budget_usage_percent=usage_pct,
            message=message
        )

cost_service = CostIntelligenceService()
