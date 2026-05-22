import argparse
import csv
from datetime import datetime, timezone
from pathlib import Path
import uuid


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _prompt_bool(message: str) -> bool:
    while True:
        value = input(message).strip().lower()
        if value in {"y", "yes"}:
            return True
        if value in {"n", "no"}:
            return False
        print("Please answer with 'y' or 'n'.")


def collect_activities() -> list[dict[str, str]]:
    activities: list[dict[str, str]] = []
    print("Enter activities. Leave title empty to finish.")
    while True:
        title = input("Title: ").strip()
        if not title:
            break
        description = input("Description: ").strip()
        is_image_required = _prompt_bool("Image required? (y/n): ")
        activities.append(
            {
                "id": str(uuid.uuid4()),
                "created_at": _utcnow_iso(),
                "title": title,
                "description": description,
                "isImageRequired": "true" if is_image_required else "false",
            }
        )
    return activities


def write_csv(rows: list[dict[str, str]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["id", "created_at", "title", "description", "isImageRequired"]
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Interactively build activities and export a CSV for Supabase import."
    )
    parser.add_argument(
        "--output",
        default="activities.csv",
        help="Output CSV path (default: activities.csv)",
    )
    args = parser.parse_args()

    rows = collect_activities()
    if not rows:
        print("No activities entered. Nothing to write.")
        return

    output_path = Path(args.output).resolve()
    write_csv(rows, output_path)
    print(f"Wrote {len(rows)} activities to {output_path}")


if __name__ == "__main__":
    main()
