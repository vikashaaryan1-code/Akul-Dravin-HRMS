const fs = require('fs');
const path = require('path');

const files = [
  'src/components/system/cards/GlassCard.tsx',
  'src/components/modules/IncidentReplayView.tsx',
  'src/components/modules/KnowledgeGraphView.tsx',
  'src/components/modules/MitigationView.tsx',
  'src/components/modules/MitigationSchedulerView.tsx',
  'src/components/modules/MitigationPlanView.tsx',
  'src/components/modules/PolicyArbitrationView.tsx',
  'src/components/modules/RcaPanel.tsx',
  'src/components/modules/WorkflowSimulationView.tsx',
  'src/components/modules/WorkflowDependencyView.tsx',
  'src/components/navigation/SideNavigation.tsx',
  'src/components/dashboards/PayrollDashboard.tsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/React\.ElementType/g, 'any');
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}`);
  }
});
