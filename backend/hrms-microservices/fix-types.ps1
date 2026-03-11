# Fix all controller return types to accept null
$files = @(
    "src/modules/meeting/meeting.controller.ts",
    "src/modules/onboarding/onboarding.controller.ts",
    "src/modules/placement/placement.controller.ts",
    "src/modules/policy/policy.controller.ts",
    "src/modules/project/project.controller.ts",
    "src/modules/salary-structure/salary-structure.controller.ts",
    "src/modules/skill/skill.controller.ts",
    "src/modules/ticket/ticket.controller.ts",
    "src/modules/timesheet/timesheet.controller.ts",
    "src/modules/announcement/announcement.service.ts",
    "src/modules/appraisal/appraisal.service.ts",
    "src/modules/asset/asset.service.ts",
    "src/modules/attendance/attendance.service.ts",
    "src/modules/benefit/benefit.service.ts",
    "src/modules/candidate/candidate.service.ts",
    "src/modules/certificate/certificate.service.ts",
    "src/modules/client/client.service.ts",
    "src/modules/commission/commission.service.ts",
    "src/modules/employee/employee.service.ts",
    "src/modules/exit/exit.service.ts",
    "src/modules/feedback/feedback.service.ts",
    "src/modules/goal/goal.service.ts",
    "src/modules/holiday/holiday.service.ts",
    "src/modules/invoice/invoice.service.ts",
    "src/modules/leave-request/leave-request.service.ts",
    "src/modules/ai-matching/ai-matching.service.ts",
    "src/modules/ai-resume-parser/ai-resume-parser.service.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file"
        $content = Get-Content $file -Raw
        $content = $content -replace 'Promise<(\w+)>', 'Promise<$1 | null>'
        Set-Content $file $content
    }
}

Write-Host "Type fixes applied"
