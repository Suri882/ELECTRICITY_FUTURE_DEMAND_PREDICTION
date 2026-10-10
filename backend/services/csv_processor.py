import io
import csv
from datetime import datetime, date
from typing import List, Dict, Any, Tuple
import pandas as pd
from backend.schemas.consumption_schema import CSVUploadSummary, CSVErrorDetail

REQUIRED_COLUMNS = ["date", "units_consumed", "bill_amount"]
OPTIONAL_COLUMNS = ["number_of_days", "peak_usage"]

class CSVDataProcessor:
    """
    Robust CSV ingestion and validation pipeline.
    Ensures data consistency, validates schemas, eliminates duplicates,
    flags format irregularities, and outputs clean normalized records.
    """

    def process_csv_content(
        self,
        content_bytes: bytes,
        existing_dates: List[date]
    ) -> Tuple[List[Dict[str, Any]], CSVUploadSummary]:
        text_content = content_bytes.decode("utf-8-sig", errors="replace")
        csv_file = io.StringIO(text_content)
        reader = csv.DictReader(csv_file)

        if not reader.fieldnames:
            summary = CSVUploadSummary(
                total_rows=0,
                successful_rows=0,
                failed_rows=0,
                error_details=[CSVErrorDetail(row=0, field="file", message="CSV file is empty or corrupted.")],
                message="CSV file contains no headers or rows."
            )
            return [], summary

        # Normalize column header names
        normalized_headers = {col.strip().lower().replace(" ", "_"): col for col in reader.fieldnames}
        
        # Verify required headers
        missing_headers = [req for req in REQUIRED_COLUMNS if req not in normalized_headers]
        if missing_headers:
            summary = CSVUploadSummary(
                total_rows=0,
                successful_rows=0,
                failed_rows=0,
                error_details=[CSVErrorDetail(row=0, field="headers", message=f"Missing required columns: {', '.join(missing_headers)}")],
                message=f"Missing required columns in CSV header: {', '.join(missing_headers)}"
            )
            return [], summary

        valid_records = []
        error_details = []
        seen_dates_in_file = set()
        existing_dates_set = set(existing_dates)
        total_rows = 0

        for row_idx, row in enumerate(reader, start=1):
            total_rows += 1
            row_errors = []

            # 1. Parse and validate Date
            raw_date_key = normalized_headers.get("date")
            raw_date_val = (row.get(raw_date_key) or "").strip()
            parsed_date = None

            if not raw_date_val:
                row_errors.append(CSVErrorDetail(row=row_idx, field="date", message="Date value is missing"))
            else:
                for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
                    try:
                        parsed_date = datetime.strptime(raw_date_val, fmt).date()
                        break
                    except ValueError:
                        continue
                if parsed_date is None:
                    row_errors.append(CSVErrorDetail(row=row_idx, field="date", message=f"Invalid date format '{raw_date_val}'. Use YYYY-MM-DD or DD-MM-YYYY."))

            # 2. Check duplicates
            if parsed_date:
                if parsed_date in seen_dates_in_file:
                    row_errors.append(CSVErrorDetail(row=row_idx, field="date", message=f"Duplicate date '{parsed_date}' within this uploaded CSV."))
                elif parsed_date in existing_dates_set:
                    row_errors.append(CSVErrorDetail(row=row_idx, field="date", message=f"Record for date '{parsed_date}' already exists in your consumption history."))

            # 3. Units consumed
            raw_units_key = normalized_headers.get("units_consumed")
            raw_units_val = (row.get(raw_units_key) or "").strip()
            units_val = None
            try:
                units_val = float(raw_units_val)
                if units_val <= 0:
                    row_errors.append(CSVErrorDetail(row=row_idx, field="units_consumed", message="Units consumed must be greater than zero."))
            except (ValueError, TypeError):
                row_errors.append(CSVErrorDetail(row=row_idx, field="units_consumed", message=f"Invalid numeric value '{raw_units_val}'."))

            # 4. Bill amount
            raw_bill_key = normalized_headers.get("bill_amount")
            raw_bill_val = (row.get(raw_bill_key) or "").strip()
            bill_val = None
            try:
                bill_val = float(raw_bill_val)
                if bill_val < 0:
                    row_errors.append(CSVErrorDetail(row=row_idx, field="bill_amount", message="Bill amount cannot be negative."))
            except (ValueError, TypeError):
                row_errors.append(CSVErrorDetail(row=row_idx, field="bill_amount", message=f"Invalid numeric bill amount '{raw_bill_val}'."))

            # 5. Number of days (Optional, default 30)
            raw_days_key = normalized_headers.get("number_of_days")
            days_val = 30
            if raw_days_key and row.get(raw_days_key):
                try:
                    days_val = int(float(row.get(raw_days_key).strip()))
                    if days_val <= 0 or days_val > 366:
                        row_errors.append(CSVErrorDetail(row=row_idx, field="number_of_days", message="Number of days must be between 1 and 366."))
                except (ValueError, TypeError):
                    row_errors.append(CSVErrorDetail(row=row_idx, field="number_of_days", message="Invalid number of days integer value."))

            # 6. Peak usage (Optional, default 0.0)
            raw_peak_key = normalized_headers.get("peak_usage")
            peak_val = 0.0
            if raw_peak_key and row.get(raw_peak_key):
                try:
                    peak_val = float(row.get(raw_peak_key).strip())
                    if peak_val < 0:
                        row_errors.append(CSVErrorDetail(row=row_idx, field="peak_usage", message="Peak usage cannot be negative."))
                    elif units_val is not None and peak_val > units_val:
                        row_errors.append(CSVErrorDetail(row=row_idx, field="peak_usage", message=f"Peak usage ({peak_val}) exceeds total units ({units_val})."))
                except (ValueError, TypeError):
                    row_errors.append(CSVErrorDetail(row=row_idx, field="peak_usage", message="Invalid numeric peak usage."))

            if row_errors:
                error_details.extend(row_errors)
            else:
                seen_dates_in_file.add(parsed_date)
                valid_records.append({
                    "date": parsed_date,
                    "units_consumed": round(units_val, 2),
                    "bill_amount": round(bill_val, 2),
                    "number_of_days": days_val,
                    "peak_usage": round(peak_val, 2)
                })

        summary = CSVUploadSummary(
            total_rows=total_rows,
            successful_rows=len(valid_records),
            failed_rows=total_rows - len(valid_records),
            error_details=error_details,
            message=f"Processed {total_rows} rows: {len(valid_records)} successfully validated, {total_rows - len(valid_records)} failed validation."
        )

        return valid_records, summary

csv_processor = CSVDataProcessor()
