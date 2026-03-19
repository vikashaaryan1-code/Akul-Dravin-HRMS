// Test API connectivity
fetch('http://localhost:4200/api/v1/jobs?status=open')
  .then(res => {
    console.log('Status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('Jobs count:', data.length);
    console.log('Jobs:', data);
  })
  .catch(err => {
    console.error('Error:', err);
  });
