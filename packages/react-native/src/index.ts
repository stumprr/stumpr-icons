import type { ReactElement } from "react";
import type { SvgProps } from "react-native-svg";

type StumprIconProps = SvgProps & {
	color?: string;
	size?: number | string;
	strokeWidth?: number | string;
};

export type StumprIcon = (props: StumprIconProps) => ReactElement;
