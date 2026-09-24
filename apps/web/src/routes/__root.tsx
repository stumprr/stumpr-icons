import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import appCss from "../index.css?url";

export const Route = createRootRouteWithContext()({
	head: () => ({
		links: [{ rel: "stylesheet", href: appCss }],
		meta: [
			{ charSet: "utf-8" },
			{ title: "Stumpr Icons" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
		],
	}),
	component: RootDocument,
});

function RootDocument() {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<div className="grid h-svh grid-rows-[auto_1fr]">
					<Outlet />
				</div>

				<Scripts />
			</body>
		</html>
	);
}
