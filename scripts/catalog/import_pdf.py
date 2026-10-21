#!/usr/bin/env python3
"""Convert UIU's bordered course-offering PDF into a validated SectionSync catalog."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber
from pypdf import PdfReader


DAY_NAMES = {
    "Sat": "Saturday",
    "Sun": "Sunday",
    "Mon": "Monday",
    "Tue": "Tuesday",
    "Wed": "Wednesday",
    "Thu": "Thursday",
    "Fri": "Friday",
}
EXPECTED_HEADER = [
    "Sl",
    "Program",
    "Course Code",
    "Title",
    "Section",
    "Room1",
    "Room2",
    "Day1",
    "Day2",
    "Time1",
    "Time2",
    "Faculty Name",
    "Faculty Initial",
    "Credit",
]


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\n", " ")).strip()


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def parse_time(value: str) -> tuple[str, str]:
    match = re.fullmatch(
        r"(\d{1,2}):(\d{2}):?(AM|PM)\s*-\s*(\d{1,2}):(\d{2}):?(AM|PM)",
        clean(value).upper(),
    )
    if not match:
        raise ValueError(f"Invalid time range: {value!r}")

    def convert(hour: str, minute: str, meridiem: str) -> str:
        h = int(hour) % 12 + (12 if meridiem == "PM" else 0)
        return f"{h:02d}:{int(minute):02d}"

    return convert(*match.groups()[:3]), convert(*match.groups()[3:])


def minutes(value: str) -> int:
    hour, minute = value.split(":")
    return int(hour) * 60 + int(minute)


def read_rows(pdf_path: Path) -> tuple[list[dict], int]:
    rows: list[dict] = []
    populated_pages = 0
    raw_lines: dict[int, str] = {}
    for page in PdfReader(pdf_path).pages:
        for line in (page.extract_text() or "").splitlines():
            match = re.match(r"^(\d+)\s+", line)
            if match:
                raw_lines[int(match.group(1))] = clean(line)
    settings = {
        "vertical_strategy": "lines",
        "horizontal_strategy": "lines",
        "snap_tolerance": 3,
        "join_tolerance": 3,
        "intersection_tolerance": 4,
    }
    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, 1):
            table = page.extract_table(settings)
            if not table or len(table) < 2:
                continue
            header = [clean(cell) for cell in table[0]]
            if header != EXPECTED_HEADER:
                raise ValueError(f"Unexpected table header on page {page_number}: {header}")
            page_count = 0
            for cells in table[1:]:
                values = [clean(cell) for cell in cells]
                if len(values) != len(EXPECTED_HEADER) or not values[0].isdigit():
                    continue
                row = dict(zip(EXPECTED_HEADER, values))
                row["sourcePage"] = page_number
                row["rawLine"] = raw_lines.get(int(row["Sl"]), "")
                rows.append(row)
                page_count += 1
            if page_count:
                populated_pages += 1
    return rows, populated_pages


def repeated_value(value: str) -> str | None:
    """Return one half when a long faculty name was repeated into the initials column."""
    value = clean(value)
    for index in range(2, len(value) - 1):
        left, right = clean(value[:index]), clean(value[index:])
        if left and left.casefold() == right.casefold():
            return left
    return None


def recover_faculty_and_credit(row: dict) -> tuple[str, str, float | int]:
    raw = row.get("rawLine", "")
    ranges = list(
        re.finditer(
            r"\d{1,2}:\d{2}:?(?:AM|PM)\s*-\s*\d{1,2}:\d{2}:?(?:AM|PM)",
            raw,
            flags=re.IGNORECASE,
        )
    )
    tail = clean(raw[ranges[-1].end() :]) if ranges else ""
    tail = re.sub(r"^\s*-\s*", "", tail)
    credit_match = re.search(r"(\d+(?:\.\d+)?)$", tail)
    if not credit_match:
        if row["Credit"].replace(".", "", 1).isdigit():
            credit = float(row["Credit"])
            return (
                clean(row["Faculty Name"]) or "TBA",
                clean(row["Faculty Initial"]),
                int(credit) if credit.is_integer() else credit,
            )
        raise ValueError(f"Credit could not be recovered at serial {row['Sl']}")
    credit = float(credit_match.group(1))
    if credit.is_integer():
        credit = int(credit)
    faculty_and_initial = clean(tail[: credit_match.start()])
    duplicate = repeated_value(faculty_and_initial)
    if duplicate:
        return duplicate, "", credit

    initial = clean(row["Faculty Initial"])
    if initial and " " not in initial and len(initial) <= 12 and faculty_and_initial.endswith(initial):
        faculty = clean(faculty_and_initial[: -len(initial)])
        # A long surname can cross the PDF column border, leaving its final
        # lowercase letter(s) at the start of the faculty-initial cell.
        overflow = re.match(r"^([a-z]+)(?=[A-Z])", initial)
        if overflow:
            faculty = clean(f"{faculty}{overflow.group(1)}")
            initial = initial[overflow.end() :]
        return faculty, initial, credit

    trailing_initial = re.search(r"([A-Z]{2,}[A-Za-z0-9]{0,8})$", faculty_and_initial)
    if trailing_initial:
        return (
            clean(faculty_and_initial[: trailing_initial.start()]),
            trailing_initial.group(1),
            credit,
        )
    for length in range(2, min(9, len(faculty_and_initial)) + 1):
        candidate = faculty_and_initial[-length:]
        if " " not in candidate and sum(character.isupper() for character in candidate) >= 2:
            return clean(faculty_and_initial[:-length]), candidate, credit
    return clean(row["Faculty Name"]) or "TBA", "", credit


def repair_overflowed_columns(rows: list[dict]) -> None:
    for row in rows:
        section = row["Section"]
        if "(" in section and row["Room2"]:
            row["Room1"] = row["Room2"]
        if any(character.islower() for character in section) and "(" not in section:
            recovered = "".join(
                character for character in section if character.isupper() or character.isdigit()
            )
            if recovered:
                row["Section"] = recovered
        raw = row.get("rawLine", "")
        prefix = f"{row['Sl']} {row['Program']} {row['Course Code']} "
        if raw.startswith(prefix) and row["Room1"]:
            before_room = clean(raw[len(prefix) :].split(f" {row['Room1']}", 1)[0])
            if before_room.endswith(row["Section"]):
                recovered_title = clean(before_room[: -len(row["Section"])])
                if recovered_title:
                    row["Title"] = recovered_title

    titles: dict[tuple[str, str], Counter] = {}
    for row in rows:
        key = (row["Program"], row["Course Code"])
        titles.setdefault(key, Counter())[row["Title"]] += 1
    canonical = {key: counts.most_common(1)[0][0] for key, counts in titles.items()}

    for row in rows:
        row["Title"] = canonical[(row["Program"], row["Course Code"])]
        raw = row.get("rawLine", "")
        prefix = f"{row['Sl']} {row['Program']} {row['Course Code']} {row['Title']}"
        raw_days = re.findall(r"(?<![A-Za-z])(Sat|Sun|Mon|Tue|Wed|Thu|Fri)(?![A-Za-z])", raw)
        had_invalid_day = row["Day1"] not in DAY_NAMES
        if had_invalid_day and raw_days:
            row["Day1"] = raw_days[0]
            row["Day2"] = raw_days[1] if len(raw_days) > 1 else ""
        if had_invalid_day and raw.startswith(prefix) and raw_days and row["Section"]:
            after_title = raw[len(prefix) :].lstrip()
            if after_title.startswith(row["Section"]):
                before_day = after_title[len(row["Section"]) :].split(raw_days[0], 1)[0].strip()
                duplicate_room = repeated_value(before_day)
                if duplicate_room:
                    row["Room1"] = duplicate_room
                    row["Room2"] = ""
        if raw.startswith(prefix) and row["Room1"]:
            before_room = raw[len(prefix) :].split(row["Room1"], 1)[0]
            recovered_section = clean(before_room)
            if recovered_section:
                row["Section"] = recovered_section
        faculty, initial, credit = recover_faculty_and_credit(row)
        row["Faculty Name"] = faculty
        row["Faculty Initial"] = initial
        row["Credit"] = str(credit)


def normalize_section(row: dict, catalog_id: str) -> dict:
    raw_section = row["Section"]
    note_match = re.search(r"\(([^)]+)\)", raw_section)
    section_name = re.sub(r"\s*\([^)]+\)\s*", "", raw_section).strip()
    meetings = []
    for suffix in ("1", "2"):
        day = row[f"Day{suffix}"]
        time_range = row[f"Time{suffix}"]
        room = row[f"Room{suffix}"]
        if not day and time_range in ("", "-"):
            continue
        if day not in DAY_NAMES:
            raise ValueError(f"Unknown day {day!r} at serial {row['Sl']}")
        start, end = parse_time(time_range)
        if start >= end:
            raise ValueError(f"Reversed meeting at serial {row['Sl']}")
        meetings.append(
            {"day": DAY_NAMES[day], "startTime": start, "endTime": end, "room": room}
        )
    if not meetings:
        raise ValueError(f"No meeting found at serial {row['Sl']}")
    duration = max(minutes(m["endTime"]) - minutes(m["startTime"]) for m in meetings)
    kind = "lab" if len(meetings) == 1 and duration >= 120 else "theory"
    section_id = f"{catalog_id}:{slug(row['Course Code'])}:{slug(section_name)}"
    return {
        "id": section_id,
        "name": section_name,
        "faculty": row["Faculty Name"] or "TBA",
        "facultyInitial": row["Faculty Initial"],
        "timeSlots": meetings,
        "preferenceOrder": 1,
        "catalogOfferingId": section_id,
        "sourceSerial": int(row["Sl"]),
        "sourcePage": int(row["sourcePage"]),
        "status": "if-required" if note_match else ("tba" if not row["Faculty Name"] or row["Faculty Name"].upper() == "TBA" else "offered"),
        "note": clean(note_match.group(1)) if note_match else "",
        "kind": kind,
    }


def build_catalog(rows: list[dict], program: str, term: str, year: int) -> tuple[dict, dict]:
    catalog_id = f"{term.lower()}-{year}-{program.lower()}"
    selected = [row for row in rows if row["Program"].upper() == program.upper()]
    courses: dict[str, dict] = {}
    flags: list[dict] = []
    for row in selected:
        section = normalize_section(row, catalog_id)
        code = row["Course Code"].upper()
        credit = float(row["Credit"])
        if credit.is_integer():
            credit = int(credit)
        course = courses.setdefault(
            code,
            {
                "id": f"{catalog_id}:{slug(code)}",
                "catalogId": catalog_id,
                "program": program.upper(),
                "code": code,
                "title": row["Title"],
                "credits": credit,
                "kind": section["kind"],
                "sections": [],
            },
        )
        if course["title"] != row["Title"] or course["credits"] != credit:
            raise ValueError(f"Inconsistent metadata for {code} at serial {row['Sl']}")
        if course["kind"] != section["kind"]:
            flags.append({"serial": int(row["Sl"]), "code": code, "issue": "mixed meeting pattern"})
        course["sections"].append(section)
        if section["status"] != "offered":
            flags.append(
                {
                    "serial": int(row["Sl"]),
                    "code": code,
                    "section": section["name"],
                    "issue": section["status"],
                }
            )

    duplicate_offerings = []
    for course in courses.values():
        names = Counter(section["name"].casefold() for section in course["sections"])
        for name, count in names.items():
            if count > 1:
                duplicate_offerings.append({"code": course["code"], "section": name, "count": count})
        course["sections"].sort(key=lambda section: section["sourceSerial"])
        for index, section in enumerate(course["sections"], 1):
            section["preferenceOrder"] = index

    if duplicate_offerings:
        raise ValueError(f"Duplicate course/section offerings: {duplicate_offerings}")

    catalog = {
        "schemaVersion": 1,
        "id": catalog_id,
        "label": f"{term.title()} {year}",
        "term": term.title(),
        "year": year,
        "program": program.upper(),
        "source": "United International University course offerings PDF",
        "courses": sorted(courses.values(), key=lambda course: course["code"]),
    }
    report = {
        "catalogId": catalog_id,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceRows": len(rows),
        "programRows": len(selected),
        "courseCount": len(catalog["courses"]),
        "sectionCount": sum(len(course["sections"]) for course in catalog["courses"]),
        "serialRange": [min(int(row["Sl"]) for row in selected), max(int(row["Sl"]) for row in selected)],
        "flags": flags,
    }
    return catalog, report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--program", default="BSCSE")
    parser.add_argument("--term", default="Fall")
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()

    rows, populated_pages = read_rows(args.pdf)
    serials = [int(row["Sl"]) for row in rows]
    if serials != list(range(1, max(serials) + 1)):
        raise ValueError("PDF serial numbers are missing, duplicated, or out of order.")
    repair_overflowed_columns(rows)
    catalog, report = build_catalog(rows, args.program, args.term, args.year)
    report["populatedPages"] = populated_pages
    report["pdfPageCount"] = 54
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(catalog, indent=2, ensure_ascii=True) + "\n")
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=True) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
