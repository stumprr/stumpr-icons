import { createElement, useContext, type ComponentPropsWithRef, type ReactElement } from "react";
import type { IconNode } from "@stumpr/icons";
import { StumprIconContext } from "./context";

export type StumprIconProps = ComponentPropsWithRef<"svg"> & {
	color?: string;
	size?: number | string;
	strokeWidth?: number | string;
};

export type StumprIcon = {
	(props: StumprIconProps): ReactElement;
	displayName?: string;
};

export function createStumprIcon(iconName: string, iconNode: IconNode): StumprIcon {
	const Component: StumprIcon = (props: StumprIconProps) => {
		const context = useContext(StumprIconContext);

		const { color, size, strokeWidth, className, children, ...rest } = props;

		const finalColor = color ?? context.color ?? "currentColor";
		const finalSize = size ?? context.size ?? 24;
		const finalStrokeWidth = strokeWidth ?? context.strokeWidth ?? 2;
		const finalClassName = [context.className, className].filter(Boolean).join(" ") || undefined;

		return createElement(
			"svg",
			{
				xmlns: "http://www.w3.org/2000/svg",
				width: finalSize,
				height: finalSize,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: finalColor,
				strokeWidth: finalStrokeWidth,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				className: finalClassName,
				...rest,
			},
			...iconNode.map(([tag, attrs], idx) => createElement(tag, { key: idx, ...attrs })),
			...(Array.isArray(children) ? children : [children]),
		);
	};

	Component.displayName = iconName;
	return Component;
}
