import type { ComponentType, ReactElement } from "react";
import Svg, {
	Circle,
	G,
	Line,
	Path,
	Polygon,
	Polyline,
	Rect,
	type SvgProps,
} from "react-native-svg";
import type { IconNode } from "@stumpr/icons";

type StumprIconProps = SvgProps & {
	color?: string;
	size?: number | string;
	strokeWidth?: number | string;
};

export type StumprIcon = {
	(props: StumprIconProps): ReactElement;
	displayName?: string;
};

const elementMap: Record<string, ComponentType<any>> = {
	path: Path,
	circle: Circle,
	rect: Rect,
	line: Line,
	polyline: Polyline,
	polygon: Polygon,
	g: G,
};

export function createStumprIcon(iconName: string, iconNode: IconNode): StumprIcon {
	const Component: StumprIcon = ({
		color = "currentColor",
		size = 24,
		strokeWidth = 2,
		children,
		...rest
	}: StumprIconProps) => {
		return (
			<Svg
				width={size}
				height={size}
				viewBox="0 0 24 24"
				fill="none"
				stroke={color}
				strokeWidth={strokeWidth}
				strokeLinecap="round"
				strokeLinejoin="round"
				{...rest}
			>
				{iconNode.map(([tag, attrs], idx) => {
					const ElementComponent = elementMap[tag.toLowerCase()] ?? Path;
					return <ElementComponent key={idx} {...attrs} />;
				})}
				{children}
			</Svg>
		);
	};

	Component.displayName = iconName;
	return Component;
}
