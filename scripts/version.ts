const args = Bun.argv.slice(2);
const version = args[0];

if (
  args.length !== 1 ||
  !version ||
  version.toLowerCase().startsWith("v") ||
  !Bun.semver.satisfies(version, ">=0.0.0-0")
) {
  throw new Error(
    "Usage: bun run version <version> (for example, 0.1.2, without a v prefix)"
  );
}

const file = Bun.file(new URL("../jsr.json", import.meta.url));
const config = await file.json();
config.version = version;
await Bun.write(file, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Updated package version to ${version}`);
