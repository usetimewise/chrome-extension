import { TOAST_AUTO_DISMISS_MS } from "./constants";

const DEFAULT_THEME_CUSTOM_PROPERTIES = `
      --companion-panel-background-color: #8a8a8a;
      --companion-panel-background-image: none;
      --overlay-text: #000000;
      --overlay-muted-text: #000000;
      --overlay-primary: #000000;
      --overlay-primary-hover: #030712;
      --overlay-primary-text: #ffffff;
      --overlay-secondary-text: #000000;
      --overlay-secondary-border: #000000;
      --overlay-control-hover: rgba(17, 24, 39, 0.12);
      --overlay-danger-text: #000000;
`;

const SHARED_HOST_DECLARATIONS = `
      all: initial;
      position: fixed;
      z-index: 2147483647;
      box-sizing: border-box;
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      pointer-events: auto;
`;

const SHARED_VISUAL_STYLES = `
    .thumb-image,
    .image {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top right;
    }

    .content,
    .panel-content {
      background-color: var(--companion-panel-background-color);
      background-image: var(--companion-panel-background-image);
      background-position: left top;
      background-repeat: no-repeat;
      background-size: auto 100%;
    }
`;

const SHARED_SPEECH_STYLES = `
    .speech {
      position: relative;
      box-sizing: border-box;
      width: 100%;
      border: 2px solid var(--overlay-secondary-border);
      background: var(--overlay-control-hover);
    }

    .speech::before {
      position: absolute;
      content: "";
      background: var(--overlay-control-hover);
      transform: translateY(-50%) rotate(45deg);
    }

    .title {
      margin: 0;
      color: var(--overlay-text);
      letter-spacing: 0;
      overflow-wrap: anywhere;
    }
`;

const SHARED_SITE_BADGE_STYLES = `
    .site {
      align-items: center;
      color: var(--overlay-muted-text);
      font-size: 11px;
      font-weight: 400;
      line-height: 1.35;
    }

    .site-icon {
      display: block;
      flex: 0 0 auto;
      color: var(--overlay-muted-text);
    }

    .site-text {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
`;

const SHARED_CONTROL_STYLES = `
    .close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--overlay-muted-text);
      cursor: pointer;
      transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease;
    }

    .close:hover:not(:disabled) {
      background: var(--overlay-control-hover);
      color: var(--overlay-text);
    }

    .button {
      box-sizing: border-box;
      min-width: 0;
      border: 1px solid transparent;
      cursor: pointer;
      font: inherit;
      font-weight: 600;
      letter-spacing: 0;
      overflow-wrap: anywhere;
      transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease, opacity 140ms ease;
    }

    .button:disabled,
    .close:disabled {
      cursor: default;
      opacity: 0.62;
    }

    .primary {
      background: var(--overlay-primary);
      color: var(--overlay-primary-text);
    }

    .primary:hover:not(:disabled) {
      background: var(--overlay-primary-hover);
    }

    .secondary,
    .tertiary {
      background: transparent;
      color: var(--overlay-secondary-text);
    }

    .secondary:hover:not(:disabled),
    .tertiary:hover:not(:disabled) {
      background: var(--overlay-control-hover);
      color: var(--overlay-secondary-text);
    }

    .status {
      min-height: 0;
      color: var(--overlay-danger-text);
    }
`;

const SHARED_COMPONENT_STYLES = `
${SHARED_VISUAL_STYLES}
${SHARED_SPEECH_STYLES}
${SHARED_SITE_BADGE_STYLES}
${SHARED_CONTROL_STYLES}
`;

export const TOAST_OVERLAY_STYLES = `
    :host {
${DEFAULT_THEME_CUSTOM_PROPERTIES}

${SHARED_HOST_DECLARATIONS}
      top: 16px;
      right: 16px;
      width: min(440px, calc(100vw - 32px));
      animation: toast-in 220ms ease-out both;
    }

${SHARED_COMPONENT_STYLES}

    .toast {
      position: relative;
      box-sizing: border-box;
      width: 100%;
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--overlay-secondary-border) 25%, transparent);
      border-radius: 12px;
      background: var(--companion-panel-background-color);
      color: var(--overlay-text);
    }

    .progress {
      position: absolute;
      inset: 0 0 auto;
      z-index: 2;
      height: 2px;
      overflow: hidden;
      background: var(--overlay-control-hover);
    }

    .progress-value {
      width: 100%;
      height: 100%;
      background: var(--overlay-primary);
      transform-origin: left center;
      animation: progress-out ${TOAST_AUTO_DISMISS_MS.toString()}ms linear both;
    }

    .header {
      display: flex;
      align-items: stretch;
      width: 100%;
      min-height: 168px;
    }

    .thumb {
      position: relative;
      flex: 0 0 148px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 148px;
      min-height: 168px;
      overflow: hidden;
      background: var(--companion-panel-background-color);
      color: var(--overlay-text);
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
    }

    .content {
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      padding: 13px 13px 12px 15px;
    }

    .top-row {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      margin-bottom: 10px;
    }

    .copy {
      min-width: 0;
      flex: 1 1 auto;
    }

    .speech {
      padding: 9px 10px;
      border-radius: 14px;
    }

    .speech::before {
      top: 50%;
      left: -8px;
      width: 12px;
      height: 12px;
      border-bottom: 2px solid var(--overlay-secondary-border);
      border-left: 2px solid var(--overlay-secondary-border);
    }

    .title {
      font-size: 13px;
      font-weight: 600;
      line-height: 1.35;
    }

    .site {
      display: flex;
      gap: 5px;
      min-width: 0;
      margin-top: 7px;
    }

    .site-icon {
      width: 12px;
      height: 12px;
    }

    .close {
      flex: 0 0 auto;
      width: 24px;
      height: 24px;
      margin: -4px -4px 0 0;
      border-radius: 6px;
    }

    .actions {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 7px;
      width: 100%;
      margin-top: auto;
    }

    .button {
      width: 100%;
      min-height: 34px;
      padding: 7px 8px;
      border-radius: 7px;
      font-size: 11px;
      line-height: 1.25;
    }

    .secondary {
      border-color: var(--overlay-secondary-border);
    }

    .status {
      grid-column: 1 / -1;
      margin: 0;
      font-size: 11px;
      line-height: 1.35;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(40px) scale(0.96);
      }

      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    @keyframes progress-out {
      from {
        transform: scaleX(1);
      }

      to {
        transform: scaleX(0);
      }
    }

    @media (max-width: 380px) {
      :host {
        top: 8px;
        right: 8px;
        width: calc(100vw - 16px);
      }

      .header {
        min-height: 158px;
      }

      .thumb {
        flex-basis: 112px;
        width: 112px;
        min-height: 158px;
      }

      .content {
        padding-left: 12px;
      }

      .speech {
        padding: 8px;
      }

      .actions {
        grid-template-columns: 1fr;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
      }
    }
  `;

export const FULLSCREEN_OVERLAY_STYLES = `
    :host {
${DEFAULT_THEME_CUSTOM_PROPERTIES}

${SHARED_HOST_DECLARATIONS}
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(0, 0, 0, 0.58);
      backdrop-filter: blur(4px);
      animation: overlay-fade-in 300ms ease-out both;
    }

${SHARED_COMPONENT_STYLES}

    .panel {
      box-sizing: border-box;
      position: relative;
      display: flex;
      width: min(100%, 720px);
      min-height: 360px;
      overflow: hidden;
      padding: 0;
      border: 1px solid color-mix(in srgb, var(--overlay-secondary-border) 25%, transparent);
      border-radius: 14px;
      background: var(--companion-panel-background-color);
      color: var(--overlay-text);
      text-align: left;
      animation: panel-zoom-in 300ms ease-out both;
    }

    .close {
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 2;
      width: 30px;
      height: 30px;
      border-radius: 7px;
    }

    .image-wrap {
      position: relative;
      flex: 0 0 43%;
      display: flex;
      align-items: stretch;
      justify-content: center;
      min-width: 0;
      margin: 0;
      overflow: hidden;
      background: var(--companion-panel-background-color);
    }

    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 360px;
      font-size: 64px;
      font-weight: 700;
      line-height: 1;
    }

    .avatar-violet,
    .avatar-blue,
    .avatar-emerald,
    .avatar-rose,
    .avatar-stone,
    .avatar-cyan,
    .avatar-amber,
    .avatar-green,
    .avatar-indigo,
    .avatar-gray {
      background: var(--companion-panel-background-color);
      color: var(--overlay-text);
    }

    .panel-content {
      box-sizing: border-box;
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 48px 28px 28px 34px;
    }

    .speech {
      padding: 20px 22px;
      border-radius: 24px;
    }

    .speech::before {
      top: 50%;
      left: -11px;
      width: 17px;
      height: 17px;
      border-bottom: 2px solid var(--overlay-secondary-border);
      border-left: 2px solid var(--overlay-secondary-border);
    }

    .title {
      font-size: 23px;
      font-weight: 700;
      line-height: 1.18;
    }

    .site {
      display: inline-flex;
      gap: 7px;
      box-sizing: border-box;
      max-width: 100%;
      align-self: flex-start;
      margin: 14px 0 20px;
      padding: 5px 10px;
      border-radius: 999px;
      background: var(--overlay-control-hover);
    }

    .site-icon {
      width: 14px;
      height: 14px;
    }

    .actions {
      display: flex;
      align-items: stretch;
      gap: 10px;
      width: 100%;
    }

    .button {
      min-height: 42px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.3;
      text-align: center;
    }

    .primary {
      flex: 1 1 52%;
    }

    .secondary,
    .tertiary {
      flex: 1 1 48%;
      border-color: var(--overlay-secondary-border);
    }

    .status {
      margin: 10px 0 0;
      font-size: 12px;
      line-height: 1.4;
    }

    @keyframes overlay-fade-in {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    @keyframes panel-zoom-in {
      from {
        opacity: 0;
        transform: scale(0.95);
      }

      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @media (max-width: 620px) {
      :host {
        padding: 12px;
      }

      .panel {
        flex-direction: column;
        width: min(100%, 440px);
        min-height: 0;
        max-height: calc(100vh - 24px);
        overflow-y: auto;
        background: var(--companion-panel-background-color);
      }

      .image-wrap {
        flex: 0 0 190px;
        min-height: 190px;
      }

      .image,
      .avatar {
        min-height: 190px;
      }

      .image {
        height: 190px;
        object-position: right 22%;
      }

      .panel-content {
        padding: 26px 20px 20px;
      }

      .speech {
        padding: 16px 18px;
        border-radius: 20px;
      }

      .speech::before {
        top: -11px;
        left: 50%;
        border: 0;
        border-top: 2px solid var(--overlay-secondary-border);
        border-left: 2px solid var(--overlay-secondary-border);
        transform: translateX(-50%) rotate(45deg);
      }

      .title {
        font-size: 20px;
      }
    }

    @media (max-width: 380px) {
      .actions {
        flex-direction: column;
      }

      .button {
        flex-basis: auto;
        width: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host,
      .panel {
        animation: none;
      }
    }
  `;
