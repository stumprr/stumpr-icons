import fs from "node:fs/promises";
import path from "node:path";
import { optimize } from "svgo";
import * as cheerio from "cheerio";

const ROOT_DIR = process.cwd();
const ICONS_DIR = path.join(ROOT_DIR, "public", "icons");

export async function formatSvgFile(filePath: string) {
	const raw = await fs.readFile(filePath, "utf-8");
	const originalSize = Buffer.byteLength(raw, "utf-8");

	const optimized = optimize(raw, {
		multipass: true,
		js2svg: {
			pretty: true,
			indent: 2,
		},
		plugins: [
			"removeDimensions",
			"removeXMLProcInst",
			"removeComments",
			"removeMetadata",
			"removeEditorsNSData",
			"cleanupIds",
			"convertTransform",
			"removeUselessStrokeAndFill",
			"sortAttrs",
			{
				name: "removeAttrs",
				params: {
					attrs: ["class", "id", "data-.*"],
				},
			},
		],
	});

	// Standardize root attributes
	const $ = cheerio.load(optimized.data, { xmlMode: true });
	const svg = $("svg");

	svg.attr("xmlns", "http://www.w3.org/2000/svg");
	svg.attr("viewBox", "0 0 24 24");
	svg.attr("fill", "none");
	svg.attr("stroke", "currentColor");
	svg.attr("stroke-width", "2");
	svg.attr("stroke-linecap", "round");
	svg.attr("stroke-linejoin", "round");

	// Ensure no forbidden attributes remain on svg
	svg.removeAttr("class");
	svg.removeAttr("id");
	svg.removeAttr("style");
	svg.removeAttr("width");
	svg.removeAttr("height");

	// Remove inline stroke / fill on child elements for clean outline inheritance
	svg.find("*").each((_, elem) => {
		if (elem.type !== "tag") return;
		$(elem).removeAttr("stroke");
		$(elem).removeAttr("class");
		$(elem).removeAttr("id");
		$(elem).removeAttr("style");
		if ($(elem).attr("fill") === "none") {
			$(elem).removeAttr("fill");
		}
	});

	const formattedSvg = $.xml();
	const newSize = Buffer.byteLength(formattedSvg, "utf-8");

	await fs.writeFile(filePath, formattedSvg, "utf-8");

	return {
		file: path.basename(filePath),
		originalSize,
		newSize,
		saved: originalSize - newSize,
	};
}

export async function formatSvgs(): Promise<void> {
	console.log("✨ Formatting and minifying SVGs in public/icons...");

	try {
		const files = (await fs.readdir(ICONS_DIR)).filter((f) => f.endsWith(".svg"));
		let totalOriginal = 0;
		let totalNew = 0;

		for (const file of files) {
			const res = await formatSvgFile(path.join(ICONS_DIR, file));
			totalOriginal += res.originalSize;
			totalNew += res.newSize;
			const delta = res.saved >= 0 ? `-${res.saved}B` : `+${Math.abs(res.saved)}B`;
			console.log(`  • ${res.file}: ${res.originalSize}B ➔ ${res.newSize}B (${delta})`);
		}

		const totalDelta = totalOriginal - totalNew;
		console.log(
			`🎉 Formatted ${files.length} icon(s). Total size: ${totalNew}B (Saved: ${totalDelta}B)`,
		);
	} catch (err) {
		console.error("Formatting failed:", err);
		throw err;
	}
}

if (import.meta.main) {
	formatSvgs().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
