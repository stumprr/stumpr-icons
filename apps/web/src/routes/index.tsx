import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomeRoute,
});

function HomeRoute() {
	return (
		<div className="flex items-center justify-center h-dvh w-full">
			<h1 className="text-xl font-semibold">Stumpr Icons</h1>
		</div>
	);
}
