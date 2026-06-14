const fs = require('fs');

function appendToClass(file, additions) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/}\s*$/, `\n${additions}\n}\n`);
    fs.writeFileSync(file, content);
}

try {
    appendToClass('src/database/entities/document-record.entity.ts', `  @Column({ type: 'uuid', nullable: true })\n  signedBy?: string;`);
    appendToClass('src/database/entities/employee.entity.ts', `  @Column({ type: 'jsonb', nullable: true })\n  leaveBalances?: any;`);

    const dir = 'src/modules/ai-engine/layers';
    fs.readdirSync(dir).forEach(file => {
        if (!file.endsWith('.ts')) return;
        let text = fs.readFileSync(dir + '/' + file, 'utf8');
        
        // Fix employee possibly undefined
        text = text.replace(/leaveRequest\.employee\./g, 'leaveRequest.employee!.');
        
        // Fix string.name
        text = text.replace(/employee\.departmentId\.name/g, 'employee.departmentId');
        text = text.replace(/employee\.companyId\.name/g, 'employee.companyId');
        text = text.replace(/employee\.designation\.name/g, 'employee.designation');
        text = text.replace(/\.department\.name/g, '.departmentId');
        text = text.replace(/\.company\.name/g, '.companyId');

        // Fix catch (e) unknown error
        text = text.replace(/catch\s*\(\s*e\s*\)\s*\{/g, 'catch (err) { const e = err as any;');
        
        fs.writeFileSync(dir + '/' + file, text);
    });

    console.log('Patch 3 applied successfully');
} catch (e) {
    console.error(e);
}
