import {
    ArrowLeft,
    Check,
    Globe2,
    LoaderCircle,
    Plus,
    RotateCcw,
    Settings,
    ShieldAlert,
    UserRound,
    X,
    type LucideIcon,
} from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

export const appIcons = {
    add: Plus,
    back: ArrowLeft,
    blocking: ShieldAlert,
    check: Check,
    close: X,
    companion: UserRound,
    loading: LoaderCircle,
    restore: RotateCcw,
    settings: Settings,
    site: Globe2,
} satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof appIcons;

type AppIconProps = Omit<ComponentPropsWithoutRef<LucideIcon>, "ref"> & {
    name: AppIconName;
};

export function AppIcon({
    name,
    size = 18,
    strokeWidth = 2,
    ...props
}: AppIconProps) {
    const Icon = appIcons[name];

    return (
        <Icon
            aria-hidden="true"
            focusable="false"
            size={size}
            strokeWidth={strokeWidth}
            {...props}
        />
    );
}
