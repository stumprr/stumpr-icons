import { useContext, type ComponentType, type ReactElement } from "react";
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
import { StumprIconContext } from "./context";

export type StumprIconProps = SvgProps & {
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
		color,
		size,
		strokeWidth,
		children,
		...rest
	}: StumprIconProps) => {
		const context = useContext(StumprIconContext);

		const finalColor = color ?? context.color ?? "currentColor";
		const finalSize = size ?? context.size ?? 24;
		const finalStrokeWidth = strokeWidth ?? context.strokeWidth ?? 2;

		return (
			<Svg
				width={finalSize}
				height={finalSize}
				viewBox="0 0 24 24"
				fill="none"
				stroke={finalColor}
				strokeWidth={finalStrokeWidth}
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
