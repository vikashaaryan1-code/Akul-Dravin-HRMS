import subprocess
import sys
import time

services = [
    {"name": "resume_parser", "entry": "services.resume_parser_service.main:app", "port": "8001"},
    {"name": "candidate_matching", "entry": "services.candidate_matching_service.main:app", "port": "8002"},
    {"name": "interview_analysis", "entry": "services.interview_analysis_service.main:app", "port": "8003"},
    {"name": "workforce_analytics", "entry": "services.workforce_analytics_service.main:app", "port": "8004"},
    {"name": "attrition_prediction", "entry": "services.attrition_prediction_service.main:app", "port": "8005"},
    {"name": "hr_assistant", "entry": "services.hr_assistant_service.main:app", "port": "8006"},
    {"name": "orchestrator", "entry": "services.orchestrator_service.main:app", "port": "8000"},
]

processes = []

try:
    for service in services:
        print(f"Starting {service['name']} on port {service['port']}...")
        proc = subprocess.Popen([
            sys.executable, "-m", "uvicorn", service["entry"],
            "--host", "0.0.0.0", "--port", service["port"]
        ])
        processes.append(proc)
        time.sleep(0.5)
    
    print("All services started. Monitoring...")
    while True:
        # Check if any process has exited unexpectedly
        for proc in processes:
            if proc.poll() is not None:
                print(f"Process {proc.pid} exited with code {proc.returncode}")
                raise SystemExit("A critical service crashed.")
        time.sleep(2)
except KeyboardInterrupt:
    print("Stopping all services...")
finally:
    for proc in processes:
        try:
            proc.terminate()
            proc.wait(timeout=2)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass
