import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../..");
const packagesDir = join(repoRoot, "packages");
const sourceExtensions = new Set([".ts", ".tsx", ".mts", ".cts"]);
const packageImportPattern = /(?:from\s+|import\s*\()?["'](@agent-receipts\/[^"']+)["']/g;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (sourceExtensions.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const packageEntries = (await readdir(packagesDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const violations = [];

for (const packageDirName of packageEntries) {
  const manifestPath = join(packagesDir, packageDirName, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const packageName = manifest.name;
  const srcDir = join(packagesDir, packageDirName, "src");
  const files = await walk(srcDir);

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(packageImportPattern)) {
      const importedPackage = match[1];

      if (packageName === "@agent-receipts/core") {
        violations.push({
          file,
          reason: `core must not depend on another Agent Receipts package (${importedPackage})`,
        });
        continue;
      }

      if (importedPackage !== "@agent-receipts/core") {
        violations.push({
          file,
          reason: `${packageName} may depend on @agent-receipts/core, not sibling package ${importedPackage}`,
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Package boundary violations found:\n");
  for (const violation of violations) {
    console.error(`- ${relative(repoRoot, violation.file)}: ${violation.reason}`);
  }
  process.exitCode = 1;
} else {
  console.log("Package boundaries OK: core is dependency-free inside the workspace; packages depend only on core.");
}
