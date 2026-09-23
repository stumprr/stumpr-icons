import type { ComponentPropsWithRef, ReactElement } from "react";

type StumprIconProps = ComponentPropsWithRef<"svg"> & {
	color?: string;
	size?: number | string;
	strokeWidth?: number | string;
};

export type StumprIcon = (props: StumprIconProps) => ReactElement;
