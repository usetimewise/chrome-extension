export function setStatus(shadow: ShadowRoot, message: string): void {
    const status = shadow.querySelector<HTMLElement>(".status");
    if (status) {
        status.textContent = message;
    }
}

export function setButtonsDisabled(
    shadow: ShadowRoot,
    disabled: boolean,
): void {
    shadow.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        button.disabled = disabled;
    });
}
