import React from "react";
import { useState } from "react";
import { cn } from "../../utils";

interface TooltipProps {
	trigger: React.ReactNode;
	children: React.ReactNode;
	classes?: string;
	hoverOff?: boolean;
}

export default function Tooltip({
	trigger,
	children,
	classes,
	hoverOff,
}: TooltipProps) {
	const [hover, setHover] = useState(false);

	return (
		<div
			className="relative inline-block hover:cursor-pointer"
			onMouseOver={() => {
				if (!hoverOff) {
					setHover(true);
				}
			}}
			onMouseLeave={() => setHover(false)}
		>
			{trigger}
			{hover && (
				<div
					className={cn(
						"absolute z-50 pointer-events-none transition-all duration-300 shadow-lg border rounded-lg p-2 max-w-xs",
						classes || "-top-2 right-[calc(100%+8px)]"
					)}
					style={{
						backgroundColor: '#fef2f2', // light red background
						color: '#991b1b', // dark red text for contrast
						borderColor: '#fecaca',
						boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
					}}
				>
					{children}
				</div>
			)}
		</div>
	);
}
