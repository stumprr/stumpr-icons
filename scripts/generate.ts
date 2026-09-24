import fs from "node:fs/promises";
import path from "node:path";
import { optimize } from "svgo";
import * as cheerio from "cheerio";
import { formatSvgs } from "./format-svg";
import { lintSvgs } from "./lint-svg";

const ROOT_DIR = process.cwd();
const ICONS_DIR = path.join(ROOT_DIR, "public", "icons");
const CORE_DIR = path.join(ROOT_DIR, "packages", "core");
const REACT_DIR = path.join(ROOT_DIR, "packages", "react");
const RN_DIR = path.join(ROOT_DIR, "packages", "react-native");

function toPascalCase(str: string): string {
	return str
		.split(/[-_]+/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}

function toCamelCase(str: string): string {
	const pascal = toPascalCase(str);
	return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

const ATTR_NAME_MAP: Record<string, string> = {
	"fill-rule": "fillRule",
	"clip-rule": "clipRule",
	"stroke-width": "strokeWidth",
	"stroke-linecap": "strokeLinecap",
	"stroke-linejoin": "strokeLinejoin",
	"stroke-miterlimit": "strokeMiterlimit",
	"stroke-dasharray": "strokeDasharray",
	"stroke-dashoffset": "strokeDashoffset",
	"stroke-opacity": "strokeOpacity",
	"fill-opacity": "fillOpacity",
	"stop-color": "stopColor",
	"stop-opacity": "stopOpacity",
};

type ParsedIcon = {
	id: string;
	componentName: string;
	nodeExportName: string;
	node: [string, Record<string, string | number>][];
};

async function parseSvgFile(filePath: string): Promise<ParsedIcon> {
	const rawSvg = await fs.readFile(filePath, "utf-8");
	const baseName = path.basename(filePath, ".svg");

	if (!rawSvg.includes('viewBox="0 0 24 24"')) {
		console.warn(`[WARN] File ${filePath} does not have standard viewBox="0 0 24 24"`);
	}

	const optimized = optimize(rawSvg, {
		plugins: [
			"removeDimensions",
			"removeXMLProcInst",
			"removeComments",
			"removeMetadata",
			"removeEditorsNSData",
			"cleanupIds",
			"convertTransform",
			"removeUselessStrokeAndFill",
		],
	});

	const $ = cheerio.load(optimized.data, { xmlMode: true });
	const svg = $("svg");

	const nodes: [string, Record<string, string | number>][] = [];

	svg.children().each((_, elem) => {
		if (elem.type !== "tag") return;
		const tagName = elem.tagName.toLowerCase();
		if (tagName === "title" || tagName === "desc" || tagName === "metadata") return;

		const attribs: Record<string, string | number> = {};
		for (const [key, value] of Object.entries(elem.attribs)) {
			if (key === "xmlns" || key === "class") continue;
			const mappedKey = ATTR_NAME_MAP[key] || key;
			attribs[mappedKey] = value;
		}

		nodes.push([tagName, attribs]);
	});

	const pascalBase = toPascalCase(baseName);
	const componentName = `${pascalBase}Icon`;
	const nodeExportName = `${toCamelCase(pascalBase)}IconNode`;

	return {
		id: baseName,
		componentName,
		nodeExportName,
		node: nodes,
	};
}

async function ensureDir(dirPath: string) {
	await fs.mkdir(dirPath, { recursive: true });
}

async function main() {
	console.log("🧹 Step 1: Formatting and minifying SVGs in public/icons...");
	await formatSvgs();

	console.log("\n🛡️ Step 2: Linting SVGs against strict design rules...");
	const lintPassed = await lintSvgs();
	if (!lintPassed) {
		console.error("\n❌ Aborting icon generation due to lint errors.");
		process.exit(1);
	}

	console.log("\n🚀 Step 3: Generating Stumpr Icons packages from public/icons...");

	const icons: ParsedIcon[] = [];

	try {
		const files = (await fs.readdir(ICONS_DIR)).filter((f) => f.endsWith(".svg"));
		for (const file of files) {
			const parsed = await parseSvgFile(path.join(ICONS_DIR, file));
			icons.push(parsed);
		}
	} catch (err) {
		console.error("Failed reading icons directory:", err);
		process.exit(1);
	}

	icons.sort((a, b) => a.componentName.localeCompare(b.componentName));
	console.log(`📦 Found ${icons.length} icon(s): ${icons.map((i) => i.componentName).join(", ")}`);

	const coreIconsDir = path.join(CORE_DIR, "src", "icons");
	const reactIconsDir = path.join(REACT_DIR, "src", "icons");
	const rnIconsDir = path.join(RN_DIR, "src", "icons");

	await ensureDir(coreIconsDir);
	await ensureDir(reactIconsDir);
	await ensureDir(rnIconsDir);

	// 1. Generate @stumpr/icons (core)
	for (const icon of icons) {
		const coreContent = `import type { IconNode } from "../types";\n\nexport const ${icon.nodeExportName}: IconNode = ${JSON.stringify(icon.node, null, "\t")};\n`;
		await fs.writeFile(path.join(coreIconsDir, `${icon.componentName}.ts`), coreContent);
	}

	const coreIndexContent = `${icons.map((i) => `export { ${i.nodeExportName} } from "./${i.componentName}";`).join("\n")}\n`;
	await fs.writeFile(path.join(coreIconsDir, "index.ts"), coreIndexContent);

	const coreMainIndex = `export * from "./types";\nexport * from "./icons/index";\n`;
	await fs.writeFile(path.join(CORE_DIR, "src", "index.ts"), coreMainIndex);

	// 2. Generate @stumpr/icons-react
	for (const icon of icons) {
		const reactContent = `import { ${icon.nodeExportName} } from "@stumpr/icons";\nimport { createStumprIcon, type StumprIcon } from "../createStumprIcon";\n\nexport const ${icon.componentName}: StumprIcon = createStumprIcon("${icon.componentName}", ${icon.nodeExportName});\n`;
		await fs.writeFile(path.join(reactIconsDir, `${icon.componentName}.ts`), reactContent);
	}

	const reactIconsIndexContent = `${icons.map((i) => `export { ${i.componentName} } from "./${i.componentName}";`).join("\n")}\n`;
	await fs.writeFile(path.join(reactIconsDir, "index.ts"), reactIconsIndexContent);

	const reactMainIndex = `export type { StumprIcon } from "./createStumprIcon";\nexport * from "./icons/index";\n`;
	await fs.writeFile(path.join(REACT_DIR, "src", "index.ts"), reactMainIndex);

	// 3. Generate @stumpr/icons-react-native
	for (const icon of icons) {
		const rnContent = `import { ${icon.nodeExportName} } from "@stumpr/icons";\nimport { createStumprIcon, type StumprIcon } from "../createStumprIcon";\n\nexport const ${icon.componentName}: StumprIcon = createStumprIcon("${icon.componentName}", ${icon.nodeExportName});\n`;
		await fs.writeFile(path.join(rnIconsDir, `${icon.componentName}.tsx`), rnContent);
	}

	const rnIconsIndexContent = `${icons.map((i) => `export { ${i.componentName} } from "./${i.componentName}";`).join("\n")}\n`;
	await fs.writeFile(path.join(rnIconsDir, "index.ts"), rnIconsIndexContent);

	const rnMainIndex = `export type { StumprIcon } from "./createStumprIcon";\nexport * from "./icons/index";\n`;
	await fs.writeFile(path.join(RN_DIR, "src", "index.ts"), rnMainIndex);

	console.log(
		"✅ Successfully generated icons for @stumpr/icons, @stumpr/icons-react, and @stumpr/icons-react-native!",
	);
}

main().catch((err) => {
	console.error("Generation failed:", err);
	process.exit(1);
});
