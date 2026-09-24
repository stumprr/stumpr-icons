import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const ROOT_DIR = process.cwd();
const ICONS_DIR = path.join(ROOT_DIR, "public", "icons");

const ALLOWED_ROOT_ATTRS = new Set([
	"xmlns",
	"viewbox",
	"fill",
	"stroke",
	"stroke-width",
	"stroke-linecap",
	"stroke-linejoin",
]);

const ALLOWED_TAGS = new Set(["path", "circle", "rect", "line", "polyline", "polygon", "g"]);

const ALLOWED_CHILD_ATTRS = new Set([
	"d",
	"cx",
	"cy",
	"r",
	"rx",
	"ry",
	"x",
	"y",
	"width",
	"height",
	"points",
	"x1",
	"y1",
	"x2",
	"y2",
	"fill-rule",
	"clip-rule",
	"transform",
]);

type LintError = {
	file: string;
	message: string;
};

export async function lintSvgFile(filePath: string): Promise<LintError[]> {
	const errors: LintError[] = [];
	const fileName = path.basename(filePath);
	const raw = await fs.readFile(filePath, "utf-8");

	// 1. Filename check (kebab-case)
	if (!/^[a-z0-9]+(-[a-z0-9]+)*\.svg$/.test(fileName)) {
		errors.push({
			file: fileName,
			message: `Filename must be lowercase kebab-case (e.g. "arrow-right.svg", "home.svg"). Found "${fileName}".`,
		});
	}

	const $ = cheerio.load(raw, { xmlMode: true });
	const svg = $("svg");

	if (svg.length === 0) {
		errors.push({ file: fileName, message: "Missing root <svg> element." });
		return errors;
	}

	// 2. ViewBox check
	const viewBox = svg.attr("viewBox") ?? svg.attr("viewbox");
	if (viewBox !== "0 0 24 24") {
		errors.push({
			file: fileName,
			message: `Invalid viewBox: "${viewBox}". Must be exactly "0 0 24 24".`,
		});
	}

	// 3. No fixed dimensions
	if (svg.attr("width") !== undefined || svg.attr("height") !== undefined) {
		errors.push({
			file: fileName,
			message: 'Forbidden fixed "width" or "height" on root <svg>. Size must be dynamic via props.',
		});
	}

	// 4. Root attributes check
	const rootAttribs = svg.attr() || {};
	for (const attr of Object.keys(rootAttribs)) {
		const lower = attr.toLowerCase();
		if (!ALLOWED_ROOT_ATTRS.has(lower)) {
			errors.push({
				file: fileName,
				message: `Forbidden attribute "${attr}" on <svg>. Remove classes, IDs, styles, or extra namespaces.`,
			});
		}
	}

	// 5. Standard stroke & fill attributes
	const fill = svg.attr("fill");
	if (fill !== "none") {
		errors.push({
			file: fileName,
			message: `Invalid fill attribute "${fill}" on <svg>. Outline icons must specify fill="none".`,
		});
	}

	const stroke = svg.attr("stroke");
	if (stroke !== "currentColor") {
		errors.push({
			file: fileName,
			message: `Invalid stroke attribute "${stroke}" on <svg>. Must be stroke="currentColor".`,
		});
	}

	const strokeWidth = svg.attr("stroke-width");
	if (strokeWidth !== "2") {
		errors.push({
			file: fileName,
			message: `Invalid stroke-width attribute "${strokeWidth}". Standard is stroke-width="2".`,
		});
	}

	// 6. Child elements check
	svg.find("*").each((_, elem) => {
		if (elem.type !== "tag") return;
		const tagName = elem.tagName.toLowerCase();

		if (!ALLOWED_TAGS.has(tagName)) {
			errors.push({
				file: fileName,
				message: `Forbidden child element <${tagName}>. Only vector primitives (${Array.from(ALLOWED_TAGS).join(", ")}) are allowed.`,
			});
			return;
		}

		// Child attributes
		for (const [attr, val] of Object.entries(elem.attribs)) {
			const lowerAttr = attr.toLowerCase();
			if (!ALLOWED_CHILD_ATTRS.has(lowerAttr)) {
				errors.push({
					file: fileName,
					message: `Forbidden attribute "${attr}='${val}'" on <${tagName}>. Child elements must inherit stroke/fill and avoid classes/ids.`,
				});
			}
		}
	});

	return errors;
}

export async function lintSvgs(): Promise<boolean> {
	console.log("🔍 Linting SVG icons in public/icons against strict rules...");

	let fileCount = 0;
	const allErrors: LintError[] = [];

	try {
		const files = (await fs.readdir(ICONS_DIR)).filter((f) => f.endsWith(".svg"));
		fileCount = files.length;

		for (const file of files) {
			const errors = await lintSvgFile(path.join(ICONS_DIR, file));
			allErrors.push(...errors);
		}
	} catch (err) {
		console.error("Error reading icons directory:", err);
		return false;
	}

	if (allErrors.length > 0) {
		console.error(`\n❌ Found ${allErrors.length} lint error(s) across ${fileCount} icon(s):\n`);
		for (const err of allErrors) {
			console.error(`  • [${err.file}]: ${err.message}`);
		}
		console.error("\nRun `bun run format:svg` to auto-fix and minify attributes.\n");
		return false;
	}

	console.log(`✅ All ${fileCount} icon(s) passed strict SVG linting!`);
	return true;
}

if (import.meta.main) {
	lintSvgs()
		.then((passed) => {
			if (!passed) process.exit(1);
		})
		.catch((err) => {
			console.error("Linter failed:", err);
			process.exit(1);
		});
}
