import React from "react";
import { PropsType } from "./types";

const Button = React.forwardRef<HTMLButtonElement, PropsType>(
  (
    { variant = "primary", size = "medium", children, className, ...rest },
    ref,
  ) => {
    // Determine variant classes
    const variantClasses =
      variant === "secondary"
        ? "h-12 border border-solid border-black/[.08] hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        : "h-12 text-background bg-foreground hover:bg-[#383838]";

    const sizeClasses =
      size === "small"
        ? "px-5"
        : size === "medium"
          ? "px-7"
          : size === "large"
            ? "px-9"
            : "px-9";

    return (
      <button
        ref={ref}
        className={`${variantClasses} ${sizeClasses} ${
          size === "full" ? "w-full" : ""
        } flex mt-4 items-center cursor-pointer justify-center gap-2 rounded-full transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
