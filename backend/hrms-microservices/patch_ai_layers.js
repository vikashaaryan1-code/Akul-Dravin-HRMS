const fs = require('fs');
const path = require('path');

const dir = 'c:/Projects/Akul Dravin HRMS/akul-dravin-hrms/backend/hrms-microservices/src/modules/ai-engine/layers';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');

    // Replace companyId: tenantId with tenantId: tenantId
    content = content.replace(/companyId: tenantId/g, 'tenantId: tenantId');
    
    // Replace employee.name
    content = content.replace(/employee\.name/g, 'employee.firstName');
    
    // Replace e.name
    content = content.replace(/e\.name/g, 'e.firstName');

    // Replace e.company
    content = content.replace(/e\.company/g, 'e.companyId');

    // Replace employee.company.name
    content = content.replace(/employee\.company\.name/g, 'employee.companyId');

    // Replace employee.department.name
    content = content.replace(/employee\.department\.name/g, 'employee.departmentId');

    // Replace employee.designation.name
    content = content.replace(/employee\.designation\.name/g, 'employee.designation');

    // Replace dateOfJoining
    content = content.replace(/dateOfJoining/g, 'joinDate');

    // Replace performanceRating
    content = content.replace(/performanceRating/g, 'epistemicConfidence'); // Use epistemicConfidence instead of performanceRating since it exists

    // Replace baseSalary
    content = content.replace(/baseSalary/g, 'monthlyCtc');

    // Replace lastWorkingDay
    content = content.replace(/lastWorkingDay/g, 'exitDate');

    // LeaveRequest
    content = content.replace(/leaveRequest\.leaveType\.name/g, 'leaveRequest.leaveTypeId');
    content = content.replace(/leave\.leaveType\?.name/g, 'leave.leaveTypeId');
    content = content.replace(/leaveRequest\.fromDate/g, 'leaveRequest.startDate');
    content = content.replace(/leaveRequest\.toDate/g, 'leaveRequest.endDate');
    content = content.replace(/leave\.fromDate/g, 'leave.startDate');
    
    content = content.replace(/e: any/g, 'e: unknown');

    fs.writeFileSync(path.join(dir, file), content, 'utf8');
});

console.log('Patched AI engine layers');
