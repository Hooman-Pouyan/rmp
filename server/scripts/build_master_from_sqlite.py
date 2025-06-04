#!/usr/bin/env python3
# server/scripts/build_master_from_sqlite.py

import json
import sqlite3
from pathlib import Path

# ──────────────────────────────────────────────────────────────────────────────
# ADJUST these paths if your repo layout is different:
DB_PATH      = Path("db/RMPData.sqlite")
OUTPUT_JSON  = Path("../static/data/master_submissions.json")  # ensure this matches “static/data/…” from search API
# ──────────────────────────────────────────────────────────────────────────────

# 1) Top‐level columns to keep from tblS1Facilities (must match your SQLite column names).
#    We added "FacilityAddress" so that each JSON record includes its street address.
#    We rename "FacilityID" → "submissionId" when writing JSON.
TOP_LEVEL_FIELDS = [
    "FacilityID",            # → will become "submissionId" in output
    "FacilityName",
    "FacilityAddress",       # newly added: street address from tblS1Facilities
    "FacilityCity",
    "FacilityState",
    "FacilityZipCode",
    "FacilityCountyFIPS",
    "FacilityLatDecDegs",
    "FacilityLongDecDegs",
    "ValidLatLongFlag",
    "LatLongMethod",
    "LatLongDescription",
    "FacilityURL",
    "FacilityDUNS",
    "ParentCompanyName",
    "Company2Name",
    "CompanyDUNS",
    "Company2DUNS",
    "OperatorName",
    "EPAFacilityID",
    "SafetyInspectionDate",
    "SafetyInspectionBy",
    "SubmissionType",
    "RMPDescription",
    "NoAccidents",
    "ForeignCountry",
    "FRS_Lat",
    "FRS_Long",
]


def get_existing_tables(cursor):
    """
    Return a set of all table names in the current SQLite connection.
    """
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    return { row["name"] for row in cursor.fetchall() }


def pare_down_process(cursor, process_row, existing_tables):
    """
    Given one row from tblS1Processes, produce a dict containing exactly:
      - ProcessID
      - ProgramLevel
      - chemicals: [ { ProcessChemicalID, ChemicalID }, … ]
      - naics:      [ { NAICSCode }, … ]
      - MH_ToxicRelease: boolean (True if any prev‐program row has MH_ToxicRelease truthy)

    If tblS1PrevProgram2 or tblS1PrevProgram3 are missing, they are skipped.
    """
    proc_id = process_row["ProcessID"]
    out = {
        "ProcessID":    process_row["ProcessID"],
        "ProgramLevel": process_row["ProgramLevel"],
    }

    # ── 1. Fetch all chemicals for this process ────────────────────────────────
    cursor.execute(
        "SELECT ProcessChemicalID, ChemicalID FROM tblS1ProcessChemicals WHERE ProcessID = ?;",
        (proc_id,)
    )
    chems = [
        {"ProcessChemicalID": r["ProcessChemicalID"], "ChemicalID": r["ChemicalID"]}
        for r in cursor.fetchall()
    ]
    out["chemicals"] = chems

    # ── 2. Fetch all NAICS entries for this process ────────────────────────────
    cursor.execute(
        "SELECT Process_NAICS_ID, NAICSCode FROM tblS1Process_NAICS WHERE ProcessID = ?;",
        (proc_id,)
    )
    naics_list = []
    mh_flag_found = False

    for na_row in cursor.fetchall():
        naics_id = na_row["Process_NAICS_ID"]
        naics_list.append({"NAICSCode": na_row["NAICSCode"]})

        # 2a. Look in tblS1PrevProgram2 for any MH_ToxicRelease under this NAICS ID
        if "tblS1PrevProgram2" in existing_tables:
            cursor.execute(
                "SELECT MH_ToxicRelease FROM tblS1PrevProgram2 WHERE Process_NAICS_ID = ?;",
                (naics_id,)
            )
            for prev2 in cursor.fetchall():
                val = prev2["MH_ToxicRelease"]
                if val is not None:
                    if isinstance(val, str):
                        if val.strip().lower() == "yes":
                            mh_flag_found = True
                    elif val:
                        mh_flag_found = True

        # 2b. Look in tblS1PrevProgram3 for any MH_ToxicRelease under this NAICS ID
        if "tblS1PrevProgram3" in existing_tables:
            cursor.execute(
                "SELECT MH_ToxicRelease FROM tblS1PrevProgram3 WHERE Process_NAICS_ID = ?;",
                (naics_id,)
            )
            for prev3 in cursor.fetchall():
                val = prev3["MH_ToxicRelease"]
                if val is not None:
                    if isinstance(val, str):
                        if val.strip().lower() == "yes":
                            mh_flag_found = True
                    elif val:
                        mh_flag_found = True

    out["naics"] = naics_list
    out["MH_ToxicRelease"] = mh_flag_found
    return out


def pare_down_submission(cursor, submission_row, existing_tables):
    """
    Given a single row from tblS1Facilities, build a new dict containing:
      - "submissionId"    (from FacilityID)
      - the remaining TOP_LEVEL_FIELDS, including "FacilityAddress"
      - "processes": [ … ]            # via pare_down_process
      - (optionally) "accidents": [ … ]  # if non‐empty
    """
    sub_id = submission_row["FacilityID"]
    out = {}

    # 1) Map TOP_LEVEL_FIELDS → out, renaming "FacilityID" → "submissionId"
    for key in TOP_LEVEL_FIELDS:
        if key == "FacilityID":
            out["submissionId"] = submission_row["FacilityID"]
        else:
            # If the column is missing, .get will return None
            out[key] = submission_row.get(key)

    # ── 2. Gather all processes for this submission ─────────────────────────────
    processes = []
    if "tblS1Processes" in existing_tables:
        cursor.execute(
            "SELECT * FROM tblS1Processes WHERE FacilityID = ?;",
            (sub_id,)
        )
        for prow in cursor.fetchall():
            processes.append(
                pare_down_process(cursor, prow, existing_tables)
            )

    out["processes"] = processes

    # ── 3. Gather all accidents for this submission ─────────────────────────────
    if "tblS1Accidents" in existing_tables:
        cursor.execute(
            "SELECT * FROM tblS1Accidents WHERE FacilityID = ?;",
            (sub_id,)
        )
        acc_rows = cursor.fetchall()
        if acc_rows:
            # include full accident rows as dicts, but only if non‐empty
            out["accidents"] = [dict(arow) for arow in acc_rows]

    return out


def main():
    # 1) Verify SQLite exists
    if not DB_PATH.exists():
        print(f"Error: cannot find database at {DB_PATH!s}")
        return

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # 2) Find which tables actually exist in this DB
    existing_tables = get_existing_tables(cur)

    # 3) Fetch every submission (row) from tblS1Facilities
    if "tblS1Facilities" not in existing_tables:
        print("Error: table tblS1Facilities not found in the database.")
        conn.close()
        return

    cur.execute("SELECT * FROM tblS1Facilities ORDER BY FacilityID;")
    all_submissions = cur.fetchall()

    master_list = []
    for row in all_submissions:
        submission_row = dict(row)
        pared = pare_down_submission(cur, submission_row, existing_tables)
        master_list.append(pared)

    conn.close()

    # 4) Ensure output directory exists & write the JSON
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as outf:
        json.dump(master_list, outf, indent=2, ensure_ascii=False)

    print(f"Wrote {len(master_list)} submissions → {OUTPUT_JSON!s}")


if __name__ == "__main__":
    main()