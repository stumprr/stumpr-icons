import { createElement, type ComponentPropsWithRef, type ReactElement } from "react";
import type { IconNode } from "@stumpr/icons";

type StumprIconProps = ComponentPropsWithRef<"svg"> & {
	color?: string;
	size?: number | string;
	strokeWidth?: number | string;
};

export type StumprIcon = {
	(props: StumprIconProps): ReactElement;
	displayName?: string;
};

export function createStumprIcon(iconName: string, iconNode: IconNode): StumprIcon {
	const Component: StumprIcon = ({
		color = "currentColor",
		size = 24,
		strokeWidth = 2,
		children,
		ref,
		...rest
	}: StumprIconProps) => {
		return createElement(
			"svg",
			{
				ref,
				xmlns: "http://www.w3.org/2000/svg",
				width: size,
				height: size,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: color,
				strokeWidth,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				...rest,
			},
			...iconNode.map(([tag, attrs], idx) => createElement(tag, { key: idx, ...attrs })),
			...(Array.isArray(children) ? children : [children]),
		);
	};

	Component.displayName = iconName;
	return Component;
}
