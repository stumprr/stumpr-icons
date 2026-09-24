import { createContext, createElement, useContext, useMemo, type ReactNode } from "react";

export type StumprIconConfig = {
	color?: string;
	size?: number | string;
	strokeWidth?: number | string;
};

export const StumprIconContext = createContext<StumprIconConfig>({
	color: "currentColor",
	size: 24,
	strokeWidth: 2,
});

export type StumprIconProviderProps = StumprIconConfig & {
	value?: StumprIconConfig;
	children: ReactNode;
};

export function StumprIconProvider({
	value,
	children,
	color,
	size,
	strokeWidth,
}: StumprIconProviderProps) {
	const parent = useContext(StumprIconContext);

	const merged = useMemo(() => {
		const inline: StumprIconConfig = {};
		if (color !== undefined) inline.color = color;
		if (size !== undefined) inline.size = size;
		if (strokeWidth !== undefined) inline.strokeWidth = strokeWidth;

		return {
			...parent,
			...inline,
			...value,
		};
	}, [parent, value, color, size, strokeWidth]);

	return createElement(StumprIconContext.Provider, { value: merged }, children);
}

export function useStumprIconContext(): StumprIconConfig {
	return useContext(StumprIconContext);
}
