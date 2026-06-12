import { execSync } from 'child_process';
try {
  console.log(execSync('npm run build', { encoding: 'utf-8' }));
} catch (e) {
  console.error(e.stdout);
  console.error(e.stderr);
}