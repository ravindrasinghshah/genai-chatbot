import { ReactNode, MouseEvent } from "react";
export type PropsType = Omit<
    React.ComponentPropsWithoutRef<"button">,
    "type" | "size"
> & {
    variant?: "primary" | "secondary";
    size?: "small" | "medium" | "large" | "full";
    children: ReactNode;
    className?: string;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};