const deck1 = ['CI', 'Builder', 'Build', 'Cloud', 'Cripto', 'Dev', 'Docker', 'Git', 'K8s', 'Linux'];
const deck2 = ['CI', 'Security', 'Deploy', 'Lint', 'Format', 'Test', 'Audit', 'Scan', 'Monitor', 'Log'];
const deck3 = ['server', 'stream', 'common', 'bootstrap', 'init', 'scaffold'];

export function generateRepoName(): string {
  return deck1[Math.floor(Math.random() * deck1.length)];
}

export function generateYMLName(): string {
  return deck2[Math.floor(Math.random() * deck2.length)];
}

export function generateZIPName(): string {
  return deck3[Math.floor(Math.random() * deck3.length)];
}

export function generateAllNames() {
  return {
    repo: generateRepoName(),
    yml: generateYMLName(),
    zip: generateZIPName(),
  };
}
