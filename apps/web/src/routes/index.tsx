import { createFileRoute } from "@tanstack/react-router";
import { HomeIcon } from "@stumpr/icons-react";

export const Route = createFileRoute("/")({
	component: HomeRoute,
});

function HomeRoute() {
	return (
		<div className="flex flex-col items-center justify-center gap-4 h-dvh w-full">
			<HomeIcon className="text-blue-500" />
			<h1 className="text-xl font-semibold">Stumpr Icons</h1>
		</div>
	);
}
