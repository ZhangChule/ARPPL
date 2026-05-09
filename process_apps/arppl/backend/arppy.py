from __future__ import annotations

import csv
import io
import json
import math
import os
import shutil
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


SAME_THRESHOLD = 1e-6
SERVICE_VERSION = os.getenv("ARPPL_SERVICE_VERSION", "0.1.0")
PROCESS_ID = os.getenv("ARPPL_PROCESS_ID", "arppl-process-a")
PROCESS_NAME = os.getenv("ARPPL_PROCESS_NAME", "ARPPL point-to-plane registration")
REMOTE_APP_NAME = os.getenv("ARPPL_REMOTE_APP_NAME", "arppl_process_app")
REMOTE_ENTRY_PATH = os.getenv("ARPPL_REMOTE_ENTRY_PATH", "/assets/remoteEntry.js")
CORS_ORIGIN_REGEX = os.getenv("ARPPL_CORS_ORIGIN_REGEX", r"http://(localhost|127\.0\.0\.1)(:\d+)?")
RECORD_ROOT = Path(os.getenv("ARPPL_RECORD_ROOT", Path(__file__).resolve().parent / "records"))

app = FastAPI(title="ARPPL Process Backend", version=SERVICE_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Workflow API is intentionally separated from App API. The workflow router is
# stateless and only returns calculation data, while the app router can read and
# write local records that support the standalone interactive UI.
workflow_router = APIRouter(prefix="/workflow/v1/process-a", tags=["workflow"])
app_router = APIRouter(tags=["app"])


class RegistrationRequest(BaseModel):
    source_points: list[list[float]] = Field(..., description="Nx3 source point cloud")
    target_points: list[list[float]] = Field(..., description="Mx3 target point cloud")
    target_normals: list[list[float]] = Field(..., description="Mx3 target normals")
    source_normals: list[list[float]] | None = Field(None, description="Optional Nx3 source normals")
    u: float = Field(0.0, description="ARPPL signed-distance bias. C++ compatible default: already normalized.")
    alpha: str = Field("-inf", description="General robust loss shape alpha; use -inf for Welsch/Leclerc")
    value_n: float | None = Field(None, description="Lower tolerance in original model units")
    value_p: float | None = Field(None, description="Upper tolerance in original model units")
    u_in_original_units: bool = Field(False, description="Divide u by the normalization scale before solving")
    max_outer: int = Field(100, ge=1, le=1000)
    max_inner: int = Field(6, ge=1, le=100)
    stop: float = Field(1e-5, gt=0)
    nu_begin_k: float = Field(3.0, gt=0)
    nu_end_k: float = Field(1.0 / 6.0, gt=0)
    nu_alpha: float = Field(0.5, gt=0, lt=1)
    use_anderson: bool = True
    anderson_m: int = Field(5, ge=1, le=20)
    return_points: bool = False


class WorkflowRegistrationInput(BaseModel):
    # Platform-level metadata is optional so this service can still be called by
    # scripts or tests without a workflow orchestrator. The values are echoed in
    # the response for traceability; they are never used by the solver.
    node_id: str | None = Field(None, description="Workflow node instance id supplied by the platform")
    trace_id: str | None = Field(None, description="Distributed trace/correlation id supplied by the platform")
    payload: RegistrationRequest = Field(..., description="Pure ARPPL calculation input; no file/session state")


class WorkflowRegistrationOutput(BaseModel):
    node_id: str | None = None
    trace_id: str | None = None
    status: str = Field("succeeded", description="succeeded or failed; HTTP 4xx/5xx still represent transport errors")
    result: RegistrationSummary


class PoseSummary(BaseModel):
    translation_xyz: list[float] = Field(..., description="Transform translation [x, y, z]")
    angles_xyz_degrees: list[float] = Field(
        ...,
        description="Euler angles [roll_x, pitch_y, yaw_z] in degrees, using R = Rz(yaw) * Ry(pitch) * Rx(roll)",
    )
    angles_xyz_radians: list[float] = Field(
        ...,
        description="Euler angles [roll_x, pitch_y, yaw_z] in radians, using R = Rz(yaw) * Ry(pitch) * Rx(roll)",
    )
    rotation_matrix: list[list[float]]
    convention: str = "Rz(yaw_z) * Ry(pitch_y) * Rx(roll_x)"


class RegistrationSummary(BaseModel):
    transform: list[list[float]]
    pose: PoseSummary
    iterations: int
    final_energy: float
    out_of_tolerance: float
    scale: float
    u_final: float
    nu_final: float
    elapsed_seconds: float
    history: list[dict[str, float]]
    transformed_source_points: list[list[float]] | None = None
    transformed_source_normals: list[list[float]] | None = None
    target_points: list[list[float]] | None = None
    signed_deviations: list[float] | None = None
    deviation_stats: dict[str, float] | None = None
    visual_sample_size: int | None = None
    input_parameters: dict[str, Any] | None = None
    output_parameters: dict[str, Any] | None = None
    record_dir: str | None = None
    record_files: dict[str, str] | None = None


class ProcessRemoteModule(BaseModel):
    app_name: str
    remote_entry: str
    app_module: str
    launcher_module: str
    manifest_module: str


class ProcessEndpointManifest(BaseModel):
    app_base: str
    workflow_base: str
    health: str
    register_files: str
    workflow_run: str
    workflow_run_files: str
    workflow_manifest: str


class ProcessManifest(BaseModel):
    id: str
    name: str
    version: str
    runtime: dict[str, str]
    capabilities: list[str]
    micro_frontend: ProcessRemoteModule
    endpoints: ProcessEndpointManifest
    contracts: dict[str, Any]
    standalone: dict[str, str]


@dataclass
class ARPPLParameters:
    u: float = 0.0
    alpha: float = -math.inf
    value_n: float = -math.inf
    value_p: float = math.inf
    u_in_original_units: bool = False
    max_outer: int = 100
    max_inner: int = 6
    stop: float = 1e-5
    nu_begin_k: float = 3.0
    nu_end_k: float = 1.0 / 6.0
    nu_alpha: float = 0.5
    use_anderson: bool = True
    anderson_m: int = 5


@dataclass
class ARPPLResult:
    transform: np.ndarray
    iterations: int
    final_energy: float
    out_of_tolerance: float
    scale: float
    u_final: float
    nu_final: float
    elapsed_seconds: float
    history: list[dict[str, float]]
    transformed_points: np.ndarray | None = None
    transformed_normals: np.ndarray | None = None


class AndersonAcceleration:
    def __init__(self, m: int, dim: int, u0: np.ndarray):
        if m <= 0:
            raise ValueError("m must be positive")
        self.m = int(m)
        self.dim = int(dim)
        self.current_u = np.asarray(u0, dtype=float).copy()
        self.current_f = np.zeros(dim)
        self.prev_dg = np.zeros((dim, m))
        self.prev_df = np.zeros((dim, m))
        self.matrix = np.zeros((m, m))
        self.theta = np.zeros(m)
        self.df_scale = np.ones(m)
        self.iter = 0
        self.col_idx = 0

    def reset(self, u: np.ndarray) -> None:
        self.current_u = np.asarray(u, dtype=float).copy()
        self.current_f.fill(0.0)
        self.prev_dg.fill(0.0)
        self.prev_df.fill(0.0)
        self.matrix.fill(0.0)
        self.theta.fill(0.0)
        self.df_scale.fill(1.0)
        self.iter = 0
        self.col_idx = 0

    def compute(self, g: np.ndarray) -> np.ndarray:
        g = np.asarray(g, dtype=float)
        self.current_f = g - self.current_u

        if self.iter == 0:
            self.prev_df[:, 0] = -self.current_f
            self.prev_dg[:, 0] = -g
            self.current_u = g.copy()
        else:
            col = self.col_idx
            self.prev_df[:, col] += self.current_f
            self.prev_dg[:, col] += g

            eps = 1e-14
            scale = max(eps, float(np.linalg.norm(self.prev_df[:, col])))
            self.df_scale[col] = scale
            self.prev_df[:, col] /= scale

            m_k = min(self.m, self.iter)
            if m_k == 1:
                d_norm = float(np.linalg.norm(self.prev_df[:, col]))
                self.theta[0] = 0.0
                if d_norm > eps:
                    self.theta[0] = float((self.prev_df[:, col] / d_norm) @ (self.current_f / d_norm))
            else:
                inner = self.prev_df[:, col].T @ self.prev_df[:, :m_k]
                self.matrix[col, :m_k] = inner
                self.matrix[:m_k, col] = inner
                rhs = self.prev_df[:, :m_k].T @ self.current_f
                self.theta[:m_k] = np.linalg.lstsq(self.matrix[:m_k, :m_k], rhs, rcond=None)[0]

            scaled_theta = self.theta[:m_k] / self.df_scale[:m_k]
            self.current_u = g - self.prev_dg[:, :m_k] @ scaled_theta
            self.col_idx = (self.col_idx + 1) % self.m
            self.prev_df[:, self.col_idx] = -self.current_f
            self.prev_dg[:, self.col_idx] = -g

        self.iter += 1
        return self.current_u.copy()


class NearestNeighborIndex:
    def __init__(self, points: np.ndarray):
        self.points = np.ascontiguousarray(points, dtype=np.float64)
        self.tree = None
        try:
            from pykdtree.kdtree import KDTree  # type: ignore

            self.tree = KDTree(self.points)
        except Exception:
            self.tree = None

    def query(self, query_points: np.ndarray, k: int = 1) -> np.ndarray:
        query_points = np.ascontiguousarray(query_points, dtype=np.float64)
        k = max(1, min(int(k), len(self.points)))
        if self.tree is not None:
            _distances, idx = self.tree.query(query_points, k=k)
            return np.asarray(idx, dtype=int)
        if k == 1:
            return self._brute_force_1nn(query_points)
        return self._brute_force_knn(query_points, k)

    def _brute_force_1nn(self, query_points: np.ndarray, chunk_size: int = 512) -> np.ndarray:
        idx = np.empty(len(query_points), dtype=int)
        for start in range(0, len(query_points), chunk_size):
            stop = min(start + chunk_size, len(query_points))
            diff = query_points[start:stop, None, :] - self.points[None, :, :]
            dist2 = np.einsum("ijk,ijk->ij", diff, diff)
            idx[start:stop] = np.argmin(dist2, axis=1)
        return idx

    def _brute_force_knn(self, query_points: np.ndarray, k: int, chunk_size: int = 128) -> np.ndarray:
        idx = np.empty((len(query_points), k), dtype=int)
        for start in range(0, len(query_points), chunk_size):
            stop = min(start + chunk_size, len(query_points))
            diff = query_points[start:stop, None, :] - self.points[None, :, :]
            dist2 = np.einsum("ijk,ijk->ij", diff, diff)
            local = np.argpartition(dist2, kth=k - 1, axis=1)[:, :k]
            order = np.argsort(np.take_along_axis(dist2, local, axis=1), axis=1)
            idx[start:stop] = np.take_along_axis(local, order, axis=1)
        return idx


def run_arppl(
    source_points: Any,
    target_points: Any,
    target_normals: Any,
    source_normals: Any | None = None,
    params: ARPPLParameters | None = None,
    return_points: bool = False,
) -> ARPPLResult:
    params = params or ARPPLParameters()
    source = _as_points(source_points, "source_points")
    target = _as_points(target_points, "target_points")
    normal_y = _normalize_normals(_as_points(target_normals, "target_normals"), "target_normals")
    normal_x = None
    if source_normals is not None:
        normal_x = _normalize_normals(_as_points(source_normals, "source_normals"), "source_normals")
        if len(normal_x) != len(source):
            raise ValueError("source_normals must have the same length as source_points")
    if len(target) != len(normal_y):
        raise ValueError("target_normals must have the same length as target_points")

    start_time = time.perf_counter()
    scale = _normalization_scale(source, target)
    source_scaled = source / scale
    target_scaled = target / scale
    source_mean = source_scaled.mean(axis=0)
    target_mean = target_scaled.mean(axis=0)
    ori_x = source_scaled - source_mean
    y = target_scaled - target_mean

    # 论文符号：μ 为有向点到面残差的非对称偏置；前端保留字段名 u 以兼容旧接口。
    mu = params.u / scale if params.u_in_original_units else params.u
    alpha = params.alpha
    value_n = params.value_n / scale if math.isfinite(params.value_n) else -math.inf
    value_p = params.value_p / scale if math.isfinite(params.value_p) else math.inf

    # X 为去均值后的源点云，Y 为去均值后的目标点云；KD-tree 建在 Y 上。
    index = NearestNeighborIndex(y)
    transform = np.eye(4)
    previous_transform = transform.copy()
    x_current = _transform_points(ori_x, transform)
    idx = index.query(x_current)
    qp = y[idx]
    qn = normal_y[idx]
    w = _signed_plane_distance(x_current, qp, qn)

    abs_w = np.abs(w - mu)
    nu2 = params.nu_end_k * _find_knearest_norm_median(index, y, normal_y, nk=7)
    # 论文符号：σ 为当前外层退火尺度；历史代码中变量名为 nu1。
    sigma = max(params.nu_begin_k * float(np.median(abs_w)), nu2)
    if sigma <= 0:
        sigma = max(nu2, 1e-12)

    log_t = se3_log(transform)
    direction = np.zeros(6)
    accelerator = AndersonAcceleration(params.anderson_m, 6, log_t) if params.use_anderson else None

    previous_energy = math.inf
    best_transform = transform.copy()
    best_otp = math.inf
    best_iteration = 0
    history: list[dict[str, float]] = []
    total_iter = 0

    for _outer in range(params.max_outer):
        for _inner in range(params.max_inner):
            total_iter += 1
            energy = _general_robust_energy(w, sigma, mu, alpha)

            if accelerator is not None:
                if energy < previous_energy:
                    previous_energy = energy
                else:
                    saved = (transform.copy(), x_current.copy(), qp.copy(), qn.copy(), w.copy())
                    trial_vec = log_t + direction
                    trial_transform = se3_exp(trial_vec)
                    trial_x, trial_qp, trial_qn, trial_w = _update_correspondences(ori_x, trial_transform, y, normal_y, index)
                    trial_energy = _general_robust_energy(trial_w, sigma, mu, alpha)
                    if trial_energy < energy:
                        transform = trial_transform
                        x_current, qp, qn, w = trial_x, trial_qp, trial_qn, trial_w
                        log_t = trial_vec
                        accelerator.reset(log_t)
                        energy = trial_energy
                    else:
                        transform, x_current, qp, qn, w = saved
                    previous_energy = energy
            else:
                previous_energy = energy

            residual = w - mu
            # 论文公式：
            #   ω_n^(k)=1/(2σ^2) * ( 1/(2-α) * ((r_n^(k)-μ)/σ)^2 + 1 )^(α/2-1)
            #   λ_n^(k)=2μω_n^(k)
            # α→-∞ 时退化为 Welsch/Leclerc，此时 ω 的指数项为 exp(-((r-μ)/σ)^2/2)。
            omega_k = _general_robust_weight(residual, sigma, alpha)
            lambda_k = 2.0 * mu * omega_k
            # 工程指标 LLOTP：低于下公差的点占比，关注偏差过小/切入侧风险。
            llotp = float(np.mean(w < value_n))

            if llotp < best_otp:
                best_otp = llotp
                best_transform = transform.copy()
                best_iteration = total_iter

            direction = _point_to_plane_exp_step(transform, ori_x, qp, qn, omega_k, lambda_k)
            direction_norm = float(np.linalg.norm(direction))

            log_t = se3_log(transform) + direction
            transform = se3_exp(log_t)
            if accelerator is not None:
                aa_log_t = accelerator.compute(log_t)
                transform = se3_exp(aa_log_t)
                log_t = aa_log_t

            x_current, qp, qn, w = _update_correspondences(ori_x, transform, y, normal_y, index)
            stop_value = float(np.linalg.norm(transform - previous_transform))
            previous_transform = transform.copy()

            history.append(
                {
                    "iteration": float(total_iter),
                    "energy": float(previous_energy),
                    "out_of_tolerance": llotp,
                    "llotp": llotp,
                    "sigma": float(sigma),
                    "nu": float(sigma),
                    "mu": float(mu),
                    "u": float(mu),
                    "alpha": float(alpha) if math.isfinite(alpha) else -1e300,
                    "direction_norm": direction_norm,
                    "stop": stop_value,
                    "elapsed_seconds": float(time.perf_counter() - start_time),
                }
            )

            if stop_value < params.stop:
                break
            if sigma < mu:
                break

        stop_outer = abs(sigma - nu2) < 1e-3
        if stop_outer:
            break
        sigma = max(sigma * params.nu_alpha, nu2)
        if accelerator is not None:
            accelerator.reset(se3_log(transform))
            previous_energy = math.inf
        if history and history[-1]["llotp"] - min(item["llotp"] for item in history) < 1e-6:
            mu *= 0.4

    transform = best_transform
    x_current, qp, qn, w = _update_correspondences(ori_x, transform, y, normal_y, index)
    final_energy = _general_robust_energy(w, 1.0, 1.0, alpha)

    result_transform = transform.copy()
    result_transform[:3, 3] += -result_transform[:3, :3] @ source_mean + target_mean
    result_transform[:3, 3] *= scale

    transformed_points = None
    transformed_normals = None
    if return_points:
        transformed_points = _transform_points(source, result_transform)
        if normal_x is not None:
            transformed_normals = normal_x @ result_transform[:3, :3].T

    return ARPPLResult(
        transform=result_transform,
        iterations=best_iteration or total_iter,
        final_energy=float(final_energy),
        out_of_tolerance=float(best_otp if math.isfinite(best_otp) else 0.0),
        scale=float(scale),
        u_final=float(mu),
        nu_final=float(sigma),
        elapsed_seconds=float(time.perf_counter() - start_time),
        history=history,
        transformed_points=transformed_points,
        transformed_normals=transformed_normals,
    )


def se3_exp(vec: np.ndarray) -> np.ndarray:
    vec = np.asarray(vec, dtype=float)
    omega = vec[:3]
    upsilon = vec[3:]
    omega_hat = _skew(omega)
    theta = float(np.linalg.norm(omega))
    omega_hat2 = omega_hat @ omega_hat

    if theta < SAME_THRESHOLD:
        rotation = np.eye(3) + omega_hat + 0.5 * omega_hat2
        v_matrix = np.eye(3) + 0.5 * omega_hat + (1.0 / 6.0) * omega_hat2
    else:
        rotation = (
            np.eye(3)
            + math.sin(theta) / theta * omega_hat
            + (1.0 - math.cos(theta)) / (theta * theta) * omega_hat2
        )
        v_matrix = (
            np.eye(3)
            + (1.0 - math.cos(theta)) / (theta * theta) * omega_hat
            + (theta - math.sin(theta)) / (theta**3) * omega_hat2
        )

    matrix = np.eye(4)
    matrix[:3, :3] = rotation
    matrix[:3, 3] = v_matrix @ upsilon
    return matrix


def se3_log(matrix: np.ndarray) -> np.ndarray:
    matrix = np.asarray(matrix, dtype=float)
    rotation = matrix[:3, :3]
    translation = matrix[:3, 3]
    cos_theta = (float(np.trace(rotation)) - 1.0) / 2.0
    cos_theta = max(-1.0, min(1.0, cos_theta))
    theta = math.acos(cos_theta)

    if theta < SAME_THRESHOLD:
        omega_hat = 0.5 * (rotation - rotation.T)
        v_inv = np.eye(3) - 0.5 * omega_hat + (1.0 / 12.0) * (omega_hat @ omega_hat)
    else:
        omega_hat = theta / (2.0 * math.sin(theta)) * (rotation - rotation.T)
        omega_hat2 = omega_hat @ omega_hat
        coeff = 1.0 / (theta * theta) - (1.0 + math.cos(theta)) / (2.0 * theta * math.sin(theta))
        v_inv = np.eye(3) - 0.5 * omega_hat + coeff * omega_hat2

    upsilon = v_inv @ translation
    return np.array([omega_hat[2, 1], omega_hat[0, 2], omega_hat[1, 0], *upsilon], dtype=float)


def _point_to_plane_exp_step(
    transform: np.ndarray,
    x: np.ndarray,
    y: np.ndarray,
    normal_y: np.ndarray,
    weight_a: np.ndarray,
    weight_b: np.ndarray,
) -> np.ndarray:
    log_t = se3_log(transform)
    block_b = _vec_to_log_block(log_t)
    a, b, c = log_t[:3]
    rotation = transform[:3, :3]
    translation = transform[:3, 3]
    upsilon = log_t[3:]

    dbdw = np.zeros((9, 3))
    dbdw[1, 2] = dbdw[5, 0] = dbdw[6, 1] = -1.0
    dbdw[2, 1] = dbdw[3, 2] = dbdw[7, 0] = 1.0

    db2dw = np.zeros((9, 3))
    db2dw[3, 1] = db2dw[4, 0] = db2dw[6, 2] = db2dw[8, 0] = a
    db2dw[0, 1] = db2dw[1, 0] = db2dw[7, 2] = db2dw[8, 1] = b
    db2dw[0, 2] = db2dw[2, 0] = db2dw[4, 2] = db2dw[5, 1] = c
    db2dw[1, 1] = db2dw[2, 2] = -2.0 * a
    db2dw[3, 0] = db2dw[5, 2] = -2.0 * b
    db2dw[6, 0] = db2dw[7, 1] = -2.0 * c

    theta = math.sqrt(a * a + b * b + c * c)
    coeff = np.zeros((4, 2))
    if theta > SAME_THRESHOLD:
        st = math.sin(theta)
        ct = math.cos(theta)
        coeff[:] = [
            [st / theta, (1.0 - ct) / (theta * theta)],
            [(theta * ct - st) / (theta**3), (theta * st - 2.0 * (1.0 - ct)) / (theta**4)],
            [(1.0 - ct) / (theta * theta), (theta - st) / (theta**3)],
            [(theta * st - 2.0 * (1.0 - ct)) / (theta**4), (theta * (1.0 - ct) - 3.0 * (theta - st)) / (theta**5)],
        ]
    else:
        coeff[0, 0] = 1.0

    temp_b3 = np.vstack((a * block_b, b * block_b, c * block_b))
    block_b2 = block_b @ block_b
    temp_2b3 = np.vstack((a * block_b2, b * block_b2, c * block_b2))
    dr_dw = coeff[0, 0] * dbdw + coeff[1, 0] * temp_b3 + coeff[2, 0] * db2dw + coeff[3, 0] * temp_2b3
    dt_dw = (
        coeff[0, 1] * (dbdw @ upsilon)
        + coeff[1, 1] * (temp_b3 @ upsilon)
        + coeff[2, 1] * (db2dw @ upsilon)
        + coeff[3, 1] * (temp_2b3 @ upsilon)
    )
    dt_du = np.eye(3) + coeff[2, 0] * block_b + coeff[2, 1] * block_b2

    transformed_without_translation = x @ rotation.T
    rk = np.einsum("ij,ij->i", normal_y, transformed_without_translation - y + translation)
    jacobian = np.empty((len(x), 6), dtype=float)
    # 这里是完整点云速度的关键：避免逐点 Python for 循环，按矩阵批量构造 J_k。
    jacobian[:, 0] = np.einsum("ni,ij,nj->n", normal_y, dr_dw[0:3, :], x) + normal_y @ dt_dw[0:3]
    jacobian[:, 1] = np.einsum("ni,ij,nj->n", normal_y, dr_dw[3:6, :], x) + normal_y @ dt_dw[3:6]
    jacobian[:, 2] = np.einsum("ni,ij,nj->n", normal_y, dr_dw[6:9, :], x) + normal_y @ dt_dw[6:9]
    jacobian[:, 3:6] = normal_y @ dt_du

    weighted_j = jacobian * weight_a[:, None]
    lhs = 2.0 * jacobian.T @ weighted_j
    rhs = -2.0 * jacobian.T @ (weight_a * rk) + jacobian.T @ weight_b
    return np.linalg.lstsq(lhs, rhs, rcond=None)[0]


def _update_correspondences(
    source_centered: np.ndarray,
    transform: np.ndarray,
    target_centered: np.ndarray,
    target_normals: np.ndarray,
    index: NearestNeighborIndex,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    current = _transform_points(source_centered, transform)
    idx = index.query(current)
    qp = target_centered[idx]
    qn = target_normals[idx]
    w = _signed_plane_distance(current, qp, qn)
    return current, qp, qn, w


def _find_knearest_norm_median(index: NearestNeighborIndex, points: np.ndarray, normals: np.ndarray, nk: int) -> float:
    if len(points) <= 1:
        return 0.0
    k = min(nk, len(points))
    ids = index.query(points, k=k)
    if ids.ndim == 1:
        ids = ids[:, None]
    if ids.shape[1] <= 1:
        return 0.0
    base = ids[:, 0]
    neighbors = ids[:, 1:]
    distances = np.abs(np.einsum("ijk,ik->ij", points[neighbors] - points[base, None, :], normals[base]))
    return float(np.median(np.median(distances, axis=1)))


def _general_robust_weight(residual_mu: np.ndarray, sigma: float, alpha: float) -> np.ndarray:
    """计算论文中的 ω_n^(k)，其中 residual_mu = r_n^(k)-μ。"""
    sigma = max(float(sigma), 1e-12)
    z2 = (residual_mu / sigma) ** 2
    scale = 1.0 / (2.0 * sigma * sigma)
    if not math.isfinite(alpha) or alpha <= -1e6:
        return scale * np.exp(-0.5 * z2)
    if abs(alpha - 2.0) < 1e-8:
        return np.full_like(residual_mu, scale)
    base = 1.0 + z2 / (2.0 - alpha)
    return scale * np.power(np.maximum(base, 1e-300), alpha / 2.0 - 1.0)


def _general_robust_energy(residuals: np.ndarray, sigma: float, mu: float, alpha: float) -> float:
    """用于线搜索比较的广义鲁棒代价；常数项不影响优化方向。"""
    sigma = max(float(sigma), 1e-12)
    z2 = ((residuals - mu) / sigma) ** 2
    if not math.isfinite(alpha) or alpha <= -1e6:
        return float(np.sum(1.0 - np.exp(-0.5 * z2)))
    if abs(alpha - 2.0) < 1e-8:
        return float(0.5 * np.sum(z2))
    if abs(alpha) < 1e-8:
        return float(np.sum(np.log1p(0.5 * z2)))
    base = 1.0 + z2 / (2.0 - alpha)
    return float(np.sum((2.0 - alpha) / alpha * (np.power(np.maximum(base, 1e-300), alpha / 2.0) - 1.0)))


def _signed_plane_distance(points: np.ndarray, closest_points: np.ndarray, closest_normals: np.ndarray) -> np.ndarray:
    return np.einsum("ij,ij->i", closest_normals, points - closest_points)


def _normalization_scale(source: np.ndarray, target: np.ndarray) -> float:
    source_extent = np.ptp(source, axis=0)
    target_extent = np.ptp(target, axis=0)
    scale = max(float(np.linalg.norm(source_extent)), float(np.linalg.norm(target_extent)))
    return scale if scale > 0 else 1.0


def _as_points(value: Any, name: str) -> np.ndarray:
    array = np.asarray(value, dtype=float)
    if array.ndim != 2 or array.shape[1] != 3:
        raise ValueError(f"{name} must be an Nx3 numeric array")
    if len(array) == 0:
        raise ValueError(f"{name} must contain at least one point")
    if not np.all(np.isfinite(array)):
        raise ValueError(f"{name} contains non-finite values")
    return array


def _normalize_normals(normals: np.ndarray, name: str) -> np.ndarray:
    lengths = np.linalg.norm(normals, axis=1)
    if np.any(lengths <= 0):
        raise ValueError(f"{name} contains zero-length normals")
    return normals / lengths[:, None]


def _transform_points(points: np.ndarray, transform: np.ndarray) -> np.ndarray:
    return points @ transform[:3, :3].T + transform[:3, 3]


def _skew(vec: np.ndarray) -> np.ndarray:
    x, y, z = vec
    return np.array([[0.0, -z, y], [z, 0.0, -x], [-y, x, 0.0]], dtype=float)


def _vec_to_log_block(vec: np.ndarray) -> np.ndarray:
    wx, wy, wz = vec[:3]
    return np.array([[0.0, -wz, wy], [wz, 0.0, -wx], [-wy, wx, 0.0]], dtype=float)


def _result_to_summary(result: ARPPLResult) -> RegistrationSummary:
    return RegistrationSummary(
        transform=result.transform.tolist(),
        pose=_pose_from_transform(result.transform),
        iterations=result.iterations,
        final_energy=result.final_energy,
        out_of_tolerance=result.out_of_tolerance,
        scale=result.scale,
        u_final=result.u_final,
        nu_final=result.nu_final,
        elapsed_seconds=result.elapsed_seconds,
        history=result.history,
        transformed_source_points=None if result.transformed_points is None else result.transformed_points.tolist(),
        transformed_source_normals=None if result.transformed_normals is None else result.transformed_normals.tolist(),
    )


def _pose_from_transform(transform: np.ndarray) -> PoseSummary:
    matrix = np.asarray(transform, dtype=float)
    rotation = matrix[:3, :3]
    translation = matrix[:3, 3]
    sy = math.hypot(float(rotation[0, 0]), float(rotation[1, 0]))
    if sy > 1e-9:
        roll_x = math.atan2(float(rotation[2, 1]), float(rotation[2, 2]))
        pitch_y = math.atan2(float(-rotation[2, 0]), sy)
        yaw_z = math.atan2(float(rotation[1, 0]), float(rotation[0, 0]))
    else:
        roll_x = math.atan2(float(-rotation[1, 2]), float(rotation[1, 1]))
        pitch_y = math.atan2(float(-rotation[2, 0]), sy)
        yaw_z = 0.0
    angles = [roll_x, pitch_y, yaw_z]
    return PoseSummary(
        translation_xyz=[float(value) for value in translation],
        angles_xyz_degrees=[float(math.degrees(value)) for value in angles],
        angles_xyz_radians=[float(value) for value in angles],
        rotation_matrix=rotation.tolist(),
    )


def _sample_points(points: np.ndarray, max_points: int, seed: int) -> tuple[np.ndarray, np.ndarray]:
    if max_points <= 0 or len(points) <= max_points:
        ids = np.arange(len(points))
        return points, ids
    rng = np.random.default_rng(seed)
    ids = np.sort(rng.choice(len(points), size=max_points, replace=False))
    return points[ids], ids


def _sample_point_cloud(
    points: np.ndarray,
    normals: np.ndarray | None,
    max_points: int,
    seed: int,
) -> tuple[np.ndarray, np.ndarray | None]:
    sampled_points, ids = _sample_points(points, max_points, seed)
    sampled_normals = None if normals is None else normals[ids]
    return sampled_points, sampled_normals


def _build_visualization_payload(
    source_points: np.ndarray,
    target_points: np.ndarray,
    target_normals: np.ndarray,
    transform: np.ndarray,
    max_points: int,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict[str, float], int]:
    source_sample, _source_ids = _sample_points(source_points, max_points, seed=20260425)
    target_sample, _target_ids = _sample_points(target_points, max_points, seed=20260426)
    transformed_source = _transform_points(source_sample, transform)

    normalized_target_normals = _normalize_normals(target_normals, "target_normals")
    index = NearestNeighborIndex(target_points)
    ids = index.query(transformed_source)
    deviations = _signed_plane_distance(
        transformed_source,
        target_points[ids],
        normalized_target_normals[ids],
    )
    stats = {
        "min": float(np.min(deviations)),
        "max": float(np.max(deviations)),
        "mean": float(np.mean(deviations)),
        "mean_abs": float(np.mean(np.abs(deviations))),
        "rmse": float(np.sqrt(np.mean(deviations * deviations))),
        "p95_abs": float(np.percentile(np.abs(deviations), 95)),
    }
    return transformed_source, target_sample, deviations, stats, int(len(transformed_source))


def _safe_record_name(value: str) -> str:
    stem = Path(value or "cloud").stem
    safe = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "_" for ch in stem)
    return safe[:60] or "cloud"


def _write_csv_dicts(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    fieldnames: list[str] = []
    for row in rows:
        for key in row:
            if key not in fieldnames:
                fieldnames.append(key)
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def _write_matrix(path: Path, matrix: np.ndarray) -> None:
    lines = [" ".join(f"{value:.16g}" for value in row) for row in matrix]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _write_visual_npz(
    path: Path,
    transformed_source: np.ndarray,
    target_sample: np.ndarray,
    signed_deviations: np.ndarray,
) -> None:
    np.savez(
        path,
        transformed_source_points=np.asarray(transformed_source, dtype=np.float32),
        target_points=np.asarray(target_sample, dtype=np.float32),
        signed_deviations=np.asarray(signed_deviations, dtype=np.float32),
    )


def _write_visual_deviations_csv(
    path: Path,
    transformed_source: np.ndarray,
    signed_deviations: np.ndarray,
) -> None:
    visual_data = np.column_stack((transformed_source, signed_deviations))
    np.savetxt(
        path,
        visual_data,
        delimiter=",",
        header="x,y,z,signed_point_to_plane_deviation",
        comments="",
        fmt="%.9g",
    )


def _save_registration_record(
    source_name: str,
    target_name: str,
    source_count: int,
    target_count: int,
    input_parameters: dict[str, Any],
    output_parameters: dict[str, Any],
    result: ARPPLResult,
    transformed_source: np.ndarray,
    target_sample: np.ndarray,
    signed_deviations: np.ndarray,
) -> tuple[str, dict[str, str]]:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    run_name = f"{timestamp}_{_safe_record_name(source_name)}_to_{_safe_record_name(target_name)}"
    record_dir = RECORD_ROOT / run_name
    record_dir.mkdir(parents=True, exist_ok=True)

    summary = {
        "source_file": source_name,
        "target_file": target_name,
        "source_points": source_count,
        "target_points": target_count,
        "input_parameters": input_parameters,
        "output_parameters": output_parameters,
    }
    summary_path = record_dir / "summary.json"
    history_path = record_dir / "history.csv"
    transform_path = record_dir / "transform.txt"
    deviations_path = record_dir / "visual_deviations.csv"
    visual_data_path = record_dir / "visual_data.npz"

    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    _write_csv_dicts(history_path, result.history)
    _write_matrix(transform_path, result.transform)
    _write_visual_npz(visual_data_path, transformed_source, target_sample, signed_deviations)
    _write_visual_deviations_csv(deviations_path, transformed_source, signed_deviations)

    return str(record_dir), {
        "summary": str(summary_path),
        "history": str(history_path),
        "transform": str(transform_path),
        "visual_data": str(visual_data_path),
        "visual_deviations": str(deviations_path),
    }


def _record_files(record_dir: Path) -> dict[str, str]:
    candidates = {
        "summary": record_dir / "summary.json",
        "history": record_dir / "history.csv",
        "transform": record_dir / "transform.txt",
        "visual_data": record_dir / "visual_data.npz",
        "visual_deviations": record_dir / "visual_deviations.csv",
        "visual_target_points": record_dir / "visual_target_points.csv",
    }
    return {name: str(path) for name, path in candidates.items() if path.exists()}


def _read_visual_npz(path: Path) -> tuple[list[list[float]], list[list[float]], list[float]]:
    if not path.exists():
        return [], [], []
    try:
        with np.load(path) as data:
            transformed_source = np.asarray(data["transformed_source_points"], dtype=float).tolist()
            target_points = np.asarray(data["target_points"], dtype=float).tolist()
            signed_deviations = np.asarray(data["signed_deviations"], dtype=float).tolist()
    except (KeyError, OSError, ValueError):
        return [], [], []
    return transformed_source, target_points, signed_deviations


def _read_visual_deviations(path: Path) -> tuple[list[list[float]], list[float]]:
    if not path.exists():
        return [], []
    points: list[list[float]] = []
    deviations: list[float] = []
    with path.open("r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            try:
                points.append([float(row["x"]), float(row["y"]), float(row["z"])])
                deviations.append(float(row["signed_point_to_plane_deviation"]))
            except (KeyError, TypeError, ValueError):
                continue
    return points, deviations


def _read_visual_points(path: Path) -> list[list[float]]:
    if not path.exists():
        return []
    points: list[list[float]] = []
    with path.open("r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            try:
                points.append([float(row["x"]), float(row["y"]), float(row["z"])])
            except (KeyError, TypeError, ValueError):
                continue
    return points


def _load_record_summary(record_dir: Path) -> dict[str, Any] | None:
    summary_path = record_dir / "summary.json"
    if not summary_path.exists():
        return None
    try:
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    input_parameters = summary.get("input_parameters", {})
    output_parameters = summary.get("output_parameters", {})
    deviation_stats = output_parameters.get("deviation_stats", {})
    return {
        "id": record_dir.name,
        "created_at": record_dir.name[:15],
        "loss_name": input_parameters.get("loss_name", ""),
        "llotp": output_parameters.get("llotp"),
        "elapsed_seconds": output_parameters.get("elapsed_seconds"),
        "rmse": deviation_stats.get("rmse"),
        "source_file": summary.get("source_file", ""),
        "target_file": summary.get("target_file", ""),
        "input_parameters": input_parameters,
        "output_parameters": output_parameters,
        "record_dir": str(record_dir),
        "record_files": _record_files(record_dir),
    }


def _update_record_summary_output(record_files: dict[str, str], output_parameters: dict[str, Any]) -> None:
    summary_path_value = record_files.get("summary")
    if not summary_path_value:
        return
    summary_path = Path(summary_path_value)
    if not summary_path.exists():
        return
    try:
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return
    summary["output_parameters"] = output_parameters
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")


def _params_from_request(request: RegistrationRequest) -> ARPPLParameters:
    return ARPPLParameters(
        u=request.u,
        alpha=_parse_alpha(request.alpha),
        value_n=-math.inf if request.value_n is None else request.value_n,
        value_p=math.inf if request.value_p is None else request.value_p,
        u_in_original_units=request.u_in_original_units,
        max_outer=request.max_outer,
        max_inner=request.max_inner,
        stop=request.stop,
        nu_begin_k=request.nu_begin_k,
        nu_end_k=request.nu_end_k,
        nu_alpha=request.nu_alpha,
        use_anderson=request.use_anderson,
        anderson_m=request.anderson_m,
    )


def read_point_cloud_bytes(filename: str, content: bytes) -> tuple[np.ndarray, np.ndarray | None, np.ndarray | None]:
    suffix = filename.lower().rsplit(".", 1)[-1]
    text = content.decode("utf-8", errors="ignore")
    if suffix == "ply":
        return _read_ascii_ply(text)
    if suffix == "obj":
        return _read_obj(text)
    raise ValueError(f"Unsupported point cloud format: {filename}. Use ASCII .ply or .obj.")


def _parse_alpha(value: str | float | int) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    normalized = value.strip().lower()
    if normalized in {"-inf", "-infinity", "welsch", "leclerc"}:
        return -math.inf
    if normalized in {"inf", "+inf", "infinity"}:
        return math.inf
    return float(normalized)


def _loss_name(alpha: float) -> str:
    if not math.isfinite(alpha) or alpha <= -1e6:
        return "Welsch / Leclerc loss (alpha -> -inf)"
    if abs(alpha - 2.0) < 1e-8:
        return "L2 loss (alpha = 2)"
    if abs(alpha - 1.0) < 1e-8:
        return "Cauchy / Lorentzian loss (alpha = 1)"
    if abs(alpha) < 1e-8:
        return "Charbonnier loss (alpha = 0)"
    if abs(alpha + 2.0) < 1e-8:
        return "Geman-McClure loss (alpha = -2)"
    return f"General robust loss (alpha = {alpha:.3g})"


def _read_obj(text: str) -> tuple[np.ndarray, np.ndarray | None, np.ndarray | None]:
    vertices: list[list[float]] = []
    normals: list[list[float]] = []
    colors: list[list[float]] = []
    for line in io.StringIO(text):
        parts = line.strip().split()
        if not parts:
            continue
        if parts[0] == "v" and len(parts) >= 4:
            vertices.append([float(parts[1]), float(parts[2]), float(parts[3])])
            if len(parts) >= 7:
                colors.append([float(parts[4]), float(parts[5]), float(parts[6])])
        elif parts[0] == "vn" and len(parts) >= 4:
            normals.append([float(parts[1]), float(parts[2]), float(parts[3])])
    normal_array = np.asarray(normals, dtype=float) if len(normals) == len(vertices) else None
    color_array = np.asarray(colors, dtype=float) if len(colors) == len(vertices) else None
    return np.asarray(vertices, dtype=float), normal_array, color_array


def _read_ascii_ply(text: str) -> tuple[np.ndarray, np.ndarray | None, np.ndarray | None]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "ply":
        raise ValueError("Invalid PLY file")

    vertex_count = None
    properties: list[str] = []
    header_end = None
    in_vertex_element = False

    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("format") and "ascii" not in stripped:
            raise ValueError("Only ASCII PLY files are supported")
        if stripped.startswith("element "):
            parts = stripped.split()
            in_vertex_element = len(parts) >= 3 and parts[1] == "vertex"
            if in_vertex_element:
                vertex_count = int(parts[2])
        elif stripped.startswith("property ") and in_vertex_element:
            parts = stripped.split()
            properties.append(parts[-1])
        elif stripped == "end_header":
            header_end = i + 1
            break

    if vertex_count is None or header_end is None:
        raise ValueError("PLY header is missing vertex metadata")

    property_count = len(properties)
    vertex_text = "\n".join(lines[header_end : header_end + vertex_count])
    data = np.fromstring(vertex_text, sep=" ", dtype=float, count=vertex_count * property_count)
    if data.size != vertex_count * property_count:
        data = np.array([[float(item) for item in line.split()] for line in vertex_text.splitlines()], dtype=float)
    else:
        data = data.reshape(vertex_count, property_count)
    prop_index = {name: idx for idx, name in enumerate(properties)}
    required = ["x", "y", "z"]
    if any(name not in prop_index for name in required):
        raise ValueError("PLY vertex properties must include x/y/z")

    vertices = data[:, [prop_index["x"], prop_index["y"], prop_index["z"]]]
    normals = None
    if all(name in prop_index for name in ("nx", "ny", "nz")):
        normals = data[:, [prop_index["nx"], prop_index["ny"], prop_index["nz"]]]
    colors = None
    if all(name in prop_index for name in ("red", "green", "blue")):
        colors = data[:, [prop_index["red"], prop_index["green"], prop_index["blue"]]]
    return vertices, normals, colors


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "service": "ARPPL Python backend"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@workflow_router.get("/manifest", response_model=ProcessManifest)
def get_process_manifest() -> ProcessManifest:
    return ProcessManifest(
        id=PROCESS_ID,
        name=PROCESS_NAME,
        version=SERVICE_VERSION,
        runtime={
            "backend": "FastAPI",
            "frontend": "React micro-frontend",
            "packaging": "Docker + Vite federation",
        },
        capabilities=[
            "standalone-ui",
            "workflow-widget",
            "headless-json-registration",
            "file-registration-with-records",
        ],
        micro_frontend=ProcessRemoteModule(
            app_name=REMOTE_APP_NAME,
            remote_entry=REMOTE_ENTRY_PATH,
            app_module="./ArpplApp",
            launcher_module="./ProcessLauncher",
            manifest_module="./processManifest",
        ),
        endpoints=ProcessEndpointManifest(
            app_base="/api/process-a",
            workflow_base="/api/process-a/workflow",
            health="/health",
            register_files="/api/process-a/register-files",
            workflow_run="/api/process-a/workflow/run",
            workflow_run_files="/api/process-a/workflow/run-files",
            workflow_manifest="/api/process-a/workflow/manifest",
        ),
        contracts={
            "workflow_input": WorkflowRegistrationInput.model_json_schema(),
            "workflow_output": WorkflowRegistrationOutput.model_json_schema(),
        },
        standalone={
            "app_url": "/",
            "remote_entry_url": REMOTE_ENTRY_PATH,
        },
    )


@workflow_router.post("/run", response_model=WorkflowRegistrationOutput)
def run_workflow_registration(request: WorkflowRegistrationInput) -> WorkflowRegistrationOutput:
    # Headless workflow execution: call the existing numerical solver directly
    # and deliberately avoid record creation, file parsing side effects, local
    # sessions, or frontend-only visualization persistence.
    try:
        result = run_arppl(
            request.payload.source_points,
            request.payload.target_points,
            request.payload.target_normals,
            source_normals=request.payload.source_normals,
            params=_params_from_request(request.payload),
            return_points=request.payload.return_points,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return WorkflowRegistrationOutput(
        node_id=request.node_id,
        trace_id=request.trace_id,
        result=_result_to_summary(result),
    )


@workflow_router.post("/run-files", response_model=WorkflowRegistrationOutput)
async def run_workflow_registration_files(
    source: UploadFile = File(...),
    target: UploadFile = File(...),
    node_id: str | None = Form(None),
    trace_id: str | None = Form(None),
    u: float = Form(0.001),
    alpha: str = Form("-inf"),
    value_n: float | None = Form(-0.2),
    value_p: float | None = Form(20.0),
    u_in_original_units: bool = Form(False),
    max_outer: int = Form(30),
    max_inner: int = Form(6),
    stop: float = Form(1e-5),
    use_anderson: bool = Form(True),
    registration_sample_size: int = Form(0),
) -> WorkflowRegistrationOutput:
    # File-based workflow execution mirrors the standalone file parser but stays
    # stateless: no experiment records and no visualization artifacts.
    try:
        source_filename = source.filename or "source.ply"
        target_filename = target.filename or "target.ply"
        parsed_alpha = _parse_alpha(alpha)
        source_points, source_normals, _source_colors = read_point_cloud_bytes(
            source_filename, await source.read()
        )
        target_points, target_normals, _target_colors = read_point_cloud_bytes(
            target_filename, await target.read()
        )
        if target_normals is None:
            raise ValueError("Target point cloud must contain normals for point-to-plane ARPPL")
        source_reg_points, source_reg_normals = _sample_point_cloud(
            source_points,
            source_normals,
            registration_sample_size,
            seed=20260425,
        )
        target_reg_points, target_reg_normals = _sample_point_cloud(
            target_points,
            target_normals,
            registration_sample_size,
            seed=20260426,
        )
        if target_reg_normals is None:
            raise ValueError("Target point cloud must contain normals for point-to-plane ARPPL")
        result = run_arppl(
            source_reg_points,
            target_reg_points,
            target_reg_normals,
            source_normals=source_reg_normals,
            params=ARPPLParameters(
                u=u,
                alpha=parsed_alpha,
                value_n=-math.inf if value_n is None else value_n,
                value_p=math.inf if value_p is None else value_p,
                u_in_original_units=u_in_original_units,
                max_outer=max_outer,
                max_inner=max_inner,
                stop=stop,
                use_anderson=use_anderson,
            ),
            return_points=False,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    summary = _result_to_summary(result)
    summary.input_parameters = {
        "source_file": source_filename,
        "target_file": target_filename,
        "source_points": int(len(source_points)),
        "target_points": int(len(target_points)),
        "registration_sample_size": int(registration_sample_size),
        "u": float(u),
        "alpha": alpha,
        "value_n": None if value_n is None else float(value_n),
        "value_p": None if value_p is None else float(value_p),
        "max_outer": int(max_outer),
        "max_inner": int(max_inner),
    }
    return WorkflowRegistrationOutput(
        node_id=node_id,
        trace_id=trace_id,
        result=summary,
    )


@app_router.get("/arppl/records")
@app_router.get("/app/v1/process-a/records")
def list_registration_records() -> dict[str, list[dict[str, Any]]]:
    RECORD_ROOT.mkdir(parents=True, exist_ok=True)
    records = []
    for record_dir in sorted((path for path in RECORD_ROOT.iterdir() if path.is_dir()), reverse=True):
        summary = _load_record_summary(record_dir)
        if summary is not None:
            records.append(summary)
    return {"records": records}


@app_router.delete("/arppl/records")
@app_router.delete("/app/v1/process-a/records")
def clear_registration_records() -> dict[str, int]:
    RECORD_ROOT.mkdir(parents=True, exist_ok=True)
    deleted = 0
    for record_dir in RECORD_ROOT.iterdir():
        if record_dir.is_dir():
            shutil.rmtree(record_dir)
            deleted += 1
    return {"deleted": deleted}


@app_router.get("/arppl/records/{record_id}")
@app_router.get("/app/v1/process-a/records/{record_id}")
def get_registration_record(record_id: str) -> dict[str, Any]:
    if record_id in {".", ".."} or "/" in record_id or "\\" in record_id:
        raise HTTPException(status_code=404, detail="Record not found")
    record_dir = RECORD_ROOT / record_id
    if not record_dir.is_dir():
        raise HTTPException(status_code=404, detail="Record not found")
    summary = _load_record_summary(record_dir)
    if summary is None:
        raise HTTPException(status_code=404, detail="Record not found")
    return summary


@app_router.get("/arppl/records/{record_id}/visual")
@app_router.get("/app/v1/process-a/records/{record_id}/visual")
def get_registration_record_visual(record_id: str) -> dict[str, Any]:
    if record_id in {".", ".."} or "/" in record_id or "\\" in record_id:
        raise HTTPException(status_code=404, detail="Record not found")
    record_dir = RECORD_ROOT / record_id
    if not record_dir.is_dir():
        raise HTTPException(status_code=404, detail="Record not found")
    summary = _load_record_summary(record_dir)
    if summary is None:
        raise HTTPException(status_code=404, detail="Record not found")

    transformed_source, target_points, signed_deviations = _read_visual_npz(record_dir / "visual_data.npz")
    if not transformed_source:
        transformed_source, signed_deviations = _read_visual_deviations(record_dir / "visual_deviations.csv")
        target_points = _read_visual_points(record_dir / "visual_target_points.csv")
    if not transformed_source:
        raise HTTPException(status_code=404, detail="Record visual data not found")

    output_parameters = summary.get("output_parameters", {})
    stats = output_parameters.get("deviation_stats", {})
    return {
        **summary,
        "transformed_source_points": transformed_source,
        "target_points": target_points,
        "signed_deviations": signed_deviations,
        "deviation_stats": stats,
        "visual_sample_size": len(transformed_source),
    }


@app_router.post("/arppl/register", response_model=RegistrationSummary)
@app_router.post("/app/v1/process-a/register", response_model=RegistrationSummary)
def register_points(request: RegistrationRequest) -> RegistrationSummary:
    try:
        result = run_arppl(
            request.source_points,
            request.target_points,
            request.target_normals,
            source_normals=request.source_normals,
            params=_params_from_request(request),
            return_points=request.return_points,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _result_to_summary(result)


@app_router.post("/arppl/register-files", response_model=RegistrationSummary)
@app_router.post("/app/v1/process-a/register-files", response_model=RegistrationSummary)
async def register_files(
    source: UploadFile = File(...),
    target: UploadFile = File(...),
    u: float = Form(0.001),
    alpha: str = Form("-inf"),
    value_n: float | None = Form(-0.2),
    value_p: float | None = Form(20.0),
    u_in_original_units: bool = Form(False),
    max_outer: int = Form(30),
    max_inner: int = Form(6),
    stop: float = Form(1e-5),
    use_anderson: bool = Form(True),
    registration_sample_size: int = Form(0),
    visual_sample_size: int = Form(20000),
) -> RegistrationSummary:
    request_start = time.perf_counter()
    try:
        source_filename = source.filename or "source.ply"
        target_filename = target.filename or "target.ply"
        parsed_alpha = _parse_alpha(alpha)
        parse_start = time.perf_counter()
        source_points, source_normals, _source_colors = read_point_cloud_bytes(
            source_filename, await source.read()
        )
        target_points, target_normals, _target_colors = read_point_cloud_bytes(
            target_filename, await target.read()
        )
        parse_seconds = time.perf_counter() - parse_start
        if target_normals is None:
            raise ValueError("Target point cloud must contain normals for point-to-plane ARPPL")
        sample_start = time.perf_counter()
        source_reg_points, source_reg_normals = _sample_point_cloud(
            source_points,
            source_normals,
            registration_sample_size,
            seed=20260425,
        )
        target_reg_points, target_reg_normals = _sample_point_cloud(
            target_points,
            target_normals,
            registration_sample_size,
            seed=20260426,
        )
        sample_seconds = time.perf_counter() - sample_start
        if target_reg_normals is None:
            raise ValueError("Target point cloud must contain normals for point-to-plane ARPPL")
        params = ARPPLParameters(
            u=u,
            alpha=parsed_alpha,
            value_n=-math.inf if value_n is None else value_n,
            value_p=math.inf if value_p is None else value_p,
            u_in_original_units=u_in_original_units,
            max_outer=max_outer,
            max_inner=max_inner,
            stop=stop,
            use_anderson=use_anderson,
        )
        result = run_arppl(
            source_reg_points,
            target_reg_points,
            target_reg_normals,
            source_normals=source_reg_normals,
            params=params,
            return_points=False,
        )
        visual_start = time.perf_counter()
        transformed_source, target_sample, deviations, stats, sample_size = _build_visualization_payload(
            source_points,
            target_points,
            target_normals,
            result.transform,
            visual_sample_size,
        )
        visual_seconds = time.perf_counter() - visual_start
        input_parameters = {
            "source_file": source_filename,
            "target_file": target_filename,
            "source_points": int(len(source_points)),
            "target_points": int(len(target_points)),
            "mu_u": float(u),
            "alpha": alpha,
            "loss_name": _loss_name(parsed_alpha),
            "lower_tolerance_value_n": None if value_n is None else float(value_n),
            "upper_tolerance_value_p": None if value_p is None else float(value_p),
            "u_in_original_units": bool(u_in_original_units),
            "max_outer": int(max_outer),
            "max_inner": int(max_inner),
            "stop": float(stop),
            "use_anderson": bool(use_anderson),
            "registration_sample_size": int(registration_sample_size),
            "visual_sample_size": int(visual_sample_size),
        }
        output_parameters = {
            "llotp": float(result.out_of_tolerance),
            "iterations": int(result.iterations),
            "final_energy": float(result.final_energy),
            "scale": float(result.scale),
            "mu_final": float(result.u_final),
            "sigma_final": float(result.nu_final),
            "elapsed_seconds": float(result.elapsed_seconds),
            "deviation_stats": stats,
        }
        record_start = time.perf_counter()
        record_dir, record_files = _save_registration_record(
            source_filename,
            target_filename,
            len(source_points),
            len(target_points),
            input_parameters,
            output_parameters,
            result,
            transformed_source,
            target_sample,
            deviations,
        )
        record_seconds = time.perf_counter() - record_start
        output_parameters["timing_seconds"] = {
            "parse_input": float(parse_seconds),
            "sample_input": float(sample_seconds),
            "solve_arppl": float(result.elapsed_seconds),
            "build_visualization": float(visual_seconds),
            "save_record": float(record_seconds),
            "total_backend": float(time.perf_counter() - request_start),
        }
        _update_record_summary_output(record_files, output_parameters)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    summary = _result_to_summary(result)
    summary.transformed_source_points = transformed_source.tolist()
    summary.target_points = target_sample.tolist()
    summary.signed_deviations = deviations.tolist()
    summary.deviation_stats = stats
    summary.visual_sample_size = sample_size
    summary.input_parameters = input_parameters
    summary.output_parameters = output_parameters
    summary.record_dir = record_dir
    summary.record_files = record_files
    return summary


app.include_router(workflow_router)
app.include_router(app_router)
