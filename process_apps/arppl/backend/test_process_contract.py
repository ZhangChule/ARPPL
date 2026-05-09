from __future__ import annotations

import math
import os
import shutil
import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient


APP_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]
CASE_DIR = REPO_ROOT / "testcase" / "Special-shaped thin-walled pieces" / "cross_inner_final"
TEST_RECORD_ROOT = APP_ROOT / "backend" / "records" / f"_contract_test_{os.getpid()}"
os.environ["ARPPL_RECORD_ROOT"] = str(TEST_RECORD_ROOT)
sys.path.insert(0, str(APP_ROOT))

from backend.arppy import app  # noqa: E402


class ProcessContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls) -> None:
        shutil.rmtree(TEST_RECORD_ROOT, ignore_errors=True)

    def test_workflow_manifest_is_discoverable(self) -> None:
        response = self.client.get("/workflow/v1/process-a/manifest")

        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(body["id"], "arppl-process-a")
        self.assertEqual(body["micro_frontend"]["app_module"], "./ArpplApp")
        self.assertEqual(body["micro_frontend"]["launcher_module"], "./ProcessLauncher")
        self.assertEqual(body["endpoints"]["workflow_run"], "/api/process-a/workflow/run")
        self.assertIn("workflow_input", body["contracts"])

    def test_headless_workflow_api_runs_without_records(self) -> None:
        response = self.client.post(
            "/workflow/v1/process-a/run",
            json={
                "node_id": "unit-node",
                "trace_id": "trace-contract",
                "payload": {
                    "source_points": [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
                    "target_points": [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
                    "target_normals": [[0, 0, 1], [0, 0, 1], [0, 0, 1]],
                    "max_outer": 1,
                    "max_inner": 1,
                    "return_points": False,
                },
            },
        )

        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual(body["node_id"], "unit-node")
        self.assertEqual(body["trace_id"], "trace-contract")
        self.assertEqual(body["status"], "succeeded")
        self.assertGreaterEqual(body["result"]["iterations"], 1)
        self.assertIsNone(body["result"]["record_dir"])

    def test_app_file_api_runs_cross_inner_final_case(self) -> None:
        source_path = CASE_DIR / "cross_inner_final_source.ply"
        target_path = CASE_DIR / "cross_inner_final_target.ply"
        self.assertTrue(source_path.exists(), source_path)
        self.assertTrue(target_path.exists(), target_path)

        with source_path.open("rb") as source_file, target_path.open("rb") as target_file:
            response = self.client.post(
                "/app/v1/process-a/register-files",
                data={
                    "u": "0.001",
                    "alpha": "-inf",
                    "value_n": "-0.2",
                    "value_p": "20",
                    "max_outer": "2",
                    "max_inner": "2",
                    "stop": "0.00001",
                    "use_anderson": "true",
                    "registration_sample_size": "600",
                    "visual_sample_size": "240",
                },
                files={
                    "source": (source_path.name, source_file, "application/octet-stream"),
                    "target": (target_path.name, target_file, "application/octet-stream"),
                },
            )

        self.assertEqual(response.status_code, 200, response.text[:2000])
        body = response.json()
        self.assertGreaterEqual(body["iterations"], 1)
        self.assertGreater(body["visual_sample_size"], 0)
        self.assertEqual(len(body["transformed_source_points"]), body["visual_sample_size"])
        self.assertEqual(len(body["signed_deviations"]), body["visual_sample_size"])
        self.assertTrue(math.isfinite(body["deviation_stats"]["rmse"]))
        self.assertIn("summary", body["record_files"])
        self.assertTrue(Path(body["record_files"]["summary"]).exists())

        records = self.client.get("/app/v1/process-a/records")
        self.assertEqual(records.status_code, 200, records.text)
        self.assertGreaterEqual(len(records.json()["records"]), 1)


if __name__ == "__main__":
    unittest.main()
