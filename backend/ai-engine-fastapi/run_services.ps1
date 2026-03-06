$services = @(
  @{ Name='resume_parser'; Entry='services.resume_parser_service.main:app'; Port=8001 },
  @{ Name='candidate_matching'; Entry='services.candidate_matching_service.main:app'; Port=8002 },
  @{ Name='interview_analysis'; Entry='services.interview_analysis_service.main:app'; Port=8003 },
  @{ Name='workforce_analytics'; Entry='services.workforce_analytics_service.main:app'; Port=8004 },
  @{ Name='attrition_prediction'; Entry='services.attrition_prediction_service.main:app'; Port=8005 },
  @{ Name='hr_assistant'; Entry='services.hr_assistant_service.main:app'; Port=8006 },
  @{ Name='orchestrator'; Entry='services.orchestrator_service.main:app'; Port=9000 }
)

foreach ($service in $services) {
  Start-Process -WindowStyle Normal -FilePath "python" -ArgumentList "-m", "uvicorn", $service.Entry, "--host", "0.0.0.0", "--port", $service.Port
}

Write-Host "All AI services started in separate windows."
