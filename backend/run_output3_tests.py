from __future__ import annotations

import csv
import json
import math
from pathlib import Path

import numpy as np

from arppy import ARPPLParameters, read_point_cloud_bytes, run_arppl


ROOT = Path(__file__).resolve().parents[1]
CASE_ROOT = ROOT / "testcase" / "Cavity structural components"
CASE_NAMES = ["cylinder", "cylinder_cross", "cylinder_cross_seg"]

# The full files are 920k source points x 400k target points. Without a working
# KD-tree package in the current Python environment, this deterministic sample
# keeps the Python reproduction test practical while preserving the same inputs.
SOURCE_SAMPLE_SIZE = 20000
TARGET_SAMPLE_SIZE = 20000
RANDOM_SEED = 20260425

PARAMS = ARPPLParameters(
    u=0.001,
    alpha=-math.inf,
    value_n=-0.2,
    value_p=20.0,
    u_in_original_units=False,
    max_outer=30,
    max_inner=6,
    stop=1e-5,
    nu_begin_k=3.0,
    nu_end_k=1.0 / 6.0,
    nu_alpha=0.5,
    use_anderson=True,
    anderson_m=5,
)


def main() -> None:
    rows: list[dict[str, object]] = []
    for case_name in CASE_NAMES:
        case_dir = CASE_ROOT / case_name
        source_path = case_dir / f"{case_name}_source.ply"
        target_path = case_dir / f"{case_name}_target.ply"
        output_dir = case_dir / "output3"
        output_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n=== {case_name} ===")
        source_points, source_normals, _ = read_point_cloud_bytes(source_path.name, source_path.read_bytes())
        target_points, target_normals, _ = read_point_cloud_bytes(target_path.name, target_path.read_bytes())
        if target_normals is None:
            raise RuntimeError(f"{target_path} does not contain target normals")

        source_points, source_normals, source_ids = deterministic_sample(
            source_points,
            source_normals,
            SOURCE_SAMPLE_SIZE,
            seed=RANDOM_SEED + CASE_NAMES.index(case_name) * 2,
        )
        target_points, target_normals, target_ids = deterministic_sample(
            target_points,
            target_normals,
            TARGET_SAMPLE_SIZE,
            seed=RANDOM_SEED + CASE_NAMES.index(case_name) * 2 + 1,
        )

        result = run_arppl(
            source_points,
            target_points,
            target_normals,
            source_normals=source_normals,
            params=PARAMS,
            return_points=True,
        )

        summary = {
            "case": case_name,
            "mode": "python_arppl_deterministic_sample",
            "source_file": str(source_path),
            "target_file": str(target_path),
            "source_points_full": int(_vertex_count_from_ply(source_path)),
            "target_points_full": int(_vertex_count_from_ply(target_path)),
            "source_points_sampled": int(len(source_points)),
            "target_points_sampled": int(len(target_points)),
            "source_sample_seed": RANDOM_SEED + CASE_NAMES.index(case_name) * 2,
            "target_sample_seed": RANDOM_SEED + CASE_NAMES.index(case_name) * 2 + 1,
            "u": PARAMS.u,
            "value_n": PARAMS.value_n,
            "value_p": PARAMS.value_p,
            "iterations": int(result.iterations),
            "llotp": float(result.out_of_tolerance),
            "final_energy": float(result.final_energy),
            "scale": float(result.scale),
            "u_final": float(result.u_final),
            "nu_final": float(result.nu_final),
            "elapsed_seconds": float(result.elapsed_seconds),
        }

        write_json(output_dir / "arppl_python_sampled_summary.json", summary)
        write_history(output_dir / "arppl_python_sampled_history.csv", result.history)
        write_matrix(output_dir / "arppl_python_sampled_transform.txt", result.transform)
        write_indices(output_dir / "source_sample_indices.txt", source_ids)
        write_indices(output_dir / "target_sample_indices.txt", target_ids)
        if result.transformed_points is not None:
            write_ascii_ply(
                output_dir / "mARPPL_python_sampled_reg_pc.ply",
                result.transformed_points,
                result.transformed_normals,
            )

        rows.append(summary)
        print(
            f"LLOTP={result.out_of_tolerance:.6f}, "
            f"iter={result.iterations}, "
            f"energy={result.final_energy:.6f}, "
            f"time={result.elapsed_seconds:.2f}s"
        )

    write_summary_csv(CASE_ROOT / "output3_summary.csv", rows)
    print(f"\nWrote combined summary: {CASE_ROOT / 'output3_summary.csv'}")


def deterministic_sample(
    points: np.ndarray,
    normals: np.ndarray | None,
    sample_size: int,
    seed: int,
) -> tuple[np.ndarray, np.ndarray | None, np.ndarray]:
    rng = np.random.default_rng(seed)
    count = len(points)
    size = min(sample_size, count)
    ids = np.sort(rng.choice(count, size=size, replace=False))
    sampled_normals = None if normals is None else normals[ids]
    return points[ids], sampled_normals, ids


def _vertex_count_from_ply(path: Path) -> int:
    with path.open("r", encoding="utf-8", errors="ignore") as file:
        for line in file:
            if line.startswith("element vertex"):
                return int(line.split()[-1])
    return 0


def write_json(path: Path, value: dict[str, object]) -> None:
    path = writable_path(path)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def write_history(path: Path, history: list[dict[str, float]]) -> None:
    fieldnames = [
        "iteration",
        "energy",
        "out_of_tolerance",
        "llotp",
        "sigma",
        "nu",
        "mu",
        "u",
        "alpha",
        "direction_norm",
        "stop",
        "elapsed_seconds",
    ]
    path = writable_path(path)
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(history)


def write_summary_csv(path: Path, rows: list[dict[str, object]]) -> None:
    if not rows:
        return
    path = writable_path(path)
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def write_matrix(path: Path, matrix: np.ndarray) -> None:
    path = writable_path(path)
    lines = [" ".join(f"{value:.16g}" for value in row) for row in matrix]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_indices(path: Path, indices: np.ndarray) -> None:
    path = writable_path(path)
    path.write_text("\n".join(str(int(item)) for item in indices) + "\n", encoding="utf-8")


def write_ascii_ply(path: Path, points: np.ndarray, normals: np.ndarray | None) -> None:
    path = writable_path(path)
    with path.open("w", encoding="utf-8", newline="\n") as file:
        file.write("ply\n")
        file.write("format ascii 1.0\n")
        file.write(f"element vertex {len(points)}\n")
        file.write("property float x\nproperty float y\nproperty float z\n")
        if normals is not None:
            file.write("property float nx\nproperty float ny\nproperty float nz\n")
        file.write("end_header\n")
        if normals is None:
            for point in points:
                file.write(f"{point[0]:.10f} {point[1]:.10f} {point[2]:.10f}\n")
        else:
            for point, normal in zip(points, normals, strict=True):
                if not np.all(np.isfinite(normal)) or math.isclose(float(np.linalg.norm(normal)), 0.0):
                    normal = np.array([0.0, 0.0, 1.0])
                file.write(
                    f"{point[0]:.10f} {point[1]:.10f} {point[2]:.10f} "
                    f"{normal[0]:.10f} {normal[1]:.10f} {normal[2]:.10f}\n"
                )


def writable_path(path: Path) -> Path:
    for attempt in range(20):
        candidate = path if attempt == 0 else path.with_name(f"{path.stem}_new{attempt}{path.suffix}")
        try:
            with candidate.open("a", encoding="utf-8"):
                pass
            return candidate
        except PermissionError:
            continue
    raise PermissionError(f"No writable output filename near {path}")


if __name__ == "__main__":
    main()
