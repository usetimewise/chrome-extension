import { TOAST_AUTO_DISMISS_MS } from "./constants";

const DEFAULT_THEME_CUSTOM_PROPERTIES = `
      --overlay-text: #000000;
      --overlay-muted-text: #000000;
      --overlay-primary: #000000;
      --overlay-primary-hover: #030712;
      --overlay-primary-text: #ffffff;
      --overlay-secondary-text: #000000;
      --overlay-secondary-border: #000000;
      --overlay-control-hover: rgba(17, 24, 39, 0.12);
      --overlay-danger-text: #000000;
      --speech-text: #111827;
      --speech-surface: rgba(255, 255, 255, 0.64);
      --speech-outline: rgba(17, 24, 39, 0.3);
      --scene-backdrop-base: #713244;
      --scene-backdrop-deep: #2b1720;
      --scene-backdrop-highlight: #a95d6d;
      --scene-light: rgba(255, 210, 183, 0.38);
      --scene-shadow: rgba(21, 8, 13, 0.78);
      --scene-character-width: 118%;
      --scene-character-max-width: 320px;
      --scene-character-offset-x: 0%;
      --scene-character-offset-y: 0%;
      --scene-foot-anchor-x: 50%;
      --scene-foot-anchor-y: 92%;
      --scene-glow-x: 50%;
      --scene-glow-y: 38%;
      --scene-floor-shadow-width: 68%;
      --scene-floor-shadow-height: 7%;
      --scene-floor-shadow-offset-x: -8%;
      --scene-floor-shadow-offset-y: 1.2%;
      --scene-floor-shadow-blur: 10px;
      --scene-floor-shadow-skew: -10deg;
      --scene-floor-shadow-opacity: 0.34;
      --scene-contact-shadow-width: 25%;
      --scene-contact-shadow-height: 2.8%;
      --scene-contact-shadow-offset-x: 0%;
      --scene-contact-shadow-offset-y: 0.4%;
      --scene-contact-shadow-blur: 4px;
      --scene-contact-shadow-opacity: 0.58;
      --scene-surface-shadow-width: 46%;
      --scene-surface-shadow-height: 28%;
      --scene-surface-shadow-x: 20%;
      --scene-surface-shadow-y: 90%;
      --scene-surface-shadow-blur: 18px;
      --scene-surface-shadow-opacity: 0.26;
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
    .content,
    .panel-content {
      background: transparent;
    }

    .scene {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      background:
        linear-gradient(to bottom, transparent 58%, color-mix(in srgb, var(--scene-backdrop-deep) 42%, transparent)),
        radial-gradient(circle at 28% 42%, color-mix(in srgb, var(--scene-backdrop-highlight) 44%, transparent) 0, transparent 46%),
        linear-gradient(120deg, var(--scene-backdrop-base), color-mix(in srgb, var(--scene-backdrop-base) 88%, var(--scene-backdrop-deep)) 58%, var(--scene-backdrop-deep));
      pointer-events: none;
    }

    .scene::before {
      position: absolute;
      inset: 0;
      z-index: 3;
      content: "";
      background: radial-gradient(ellipse at center, transparent 54%, rgba(18, 6, 11, 0.2));
    }

    .scene::after {
      position: absolute;
      z-index: 1;
      top: var(--scene-surface-shadow-y);
      left: var(--scene-surface-shadow-x);
      width: var(--scene-surface-shadow-width);
      height: var(--scene-surface-shadow-height);
      border-radius: 50%;
      content: "";
      background: radial-gradient(ellipse at center, var(--scene-shadow), transparent 72%);
      opacity: var(--scene-surface-shadow-opacity);
      filter: blur(var(--scene-surface-shadow-blur));
      transform: translate(-50%, -50%);
    }

    .scene-stage {
      position: absolute;
      z-index: 2;
      inset: 0 auto 0 0;
      width: 43%;
    }

    .scene-light {
      position: absolute;
      top: var(--scene-glow-y);
      left: var(--scene-glow-x);
      width: 94%;
      aspect-ratio: 1;
      border-radius: 50%;
      background: radial-gradient(circle, var(--scene-light), transparent 67%);
      filter: blur(10px);
      transform: translate(-50%, -50%);
    }

    .scene-character {
      position: absolute;
      bottom: var(--scene-character-offset-y);
      left: calc(50% + var(--scene-character-offset-x));
      width: min(clamp(118px, var(--scene-character-width), 320px), var(--scene-character-max-width));
      aspect-ratio: 1;
      transform: translateX(-50%);
    }

    .scene-character-floor-shadow,
    .scene-character-contact-shadow {
      position: absolute;
      border-radius: 50%;
      background: var(--scene-shadow);
    }

    .scene-character-floor-shadow {
      z-index: 1;
      top: calc(var(--scene-foot-anchor-y) + var(--scene-floor-shadow-offset-y));
      left: calc(var(--scene-foot-anchor-x) + var(--scene-floor-shadow-offset-x));
      width: var(--scene-floor-shadow-width);
      height: var(--scene-floor-shadow-height);
      opacity: var(--scene-floor-shadow-opacity);
      filter: blur(var(--scene-floor-shadow-blur));
      transform: translate(-50%, -50%) skewX(var(--scene-floor-shadow-skew));
    }

    .scene-character-contact-shadow {
      z-index: 2;
      top: calc(var(--scene-foot-anchor-y) + var(--scene-contact-shadow-offset-y));
      left: calc(var(--scene-foot-anchor-x) + var(--scene-contact-shadow-offset-x));
      width: var(--scene-contact-shadow-width);
      height: var(--scene-contact-shadow-height);
      opacity: var(--scene-contact-shadow-opacity);
      filter: blur(var(--scene-contact-shadow-blur));
      transform: translate(-50%, -50%);
    }

    .scene-character-image {
      position: absolute;
      inset: 0;
      z-index: 3;
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center bottom;
      filter: saturate(0.94) contrast(1.025) brightness(0.985);
    }
`;

const SHARED_SPEECH_STYLES = `
    .speech {
      position: relative;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      aspect-ratio: 461.929 / 271.476;
      padding: 14% 12% 12% 20%;
      container-type: inline-size;
    }

    .speech-bubble-fill,
    .speech-bubble-image {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .speech-bubble-fill {
      z-index: 0;
      background: var(--speech-surface);
      -webkit-mask: var(--speech-bubble-fill-image) center / contain no-repeat;
      mask: var(--speech-bubble-fill-image) center / contain no-repeat;
    }

    .speech-bubble-image {
      z-index: 1;
      background: var(--speech-outline);
      -webkit-mask: var(--speech-bubble-image) center / contain no-repeat;
      mask: var(--speech-bubble-image) center / contain no-repeat;
    }

    .speech .title {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 100%;
      color: var(--speech-text);
      text-align: center;
      text-wrap: balance;
      overflow-wrap: normal;
      word-break: normal;
      hyphens: none;
    }

    .title {
      margin: 0;
      color: var(--overlay-text);
      letter-spacing: 0;
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
      width: min(480px, calc(100vw - 32px));
      animation: toast-in 220ms ease-out both;
    }

${SHARED_COMPONENT_STYLES}

    .toast {
      position: relative;
      box-sizing: border-box;
      width: 100%;
      max-height: calc(100vh - 32px);
      overflow: hidden auto;
      border: 1px solid color-mix(in srgb, var(--overlay-secondary-border) 25%, transparent);
      border-radius: 12px;
      background: var(--scene-backdrop-base);
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
      position: relative;
      z-index: 1;
      display: flex;
      align-items: stretch;
      width: 100%;
      min-height: 168px;
    }

    .content {
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      padding: 13px 13px 12px 15px;
    }

    .toast .content {
      margin-left: 148px;
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

    .title {
      font-size: clamp(13px, 5.2cqi, 15px);
      font-weight: 600;
      line-height: 1.42;
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

      .content {
        padding-left: 12px;
      }

      .toast .content {
        margin-left: 112px;
      }

      .toast .scene-character {
        --scene-character-max-width: 150px;
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
      width: min(100%, 760px);
      min-height: 360px;
      max-height: calc(100vh - 48px);
      overflow: hidden auto;
      padding: 0;
      border: 1px solid color-mix(in srgb, var(--overlay-secondary-border) 25%, transparent);
      border-radius: 14px;
      background: var(--scene-backdrop-base);
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

    .panel-content {
      position: relative;
      z-index: 1;
      box-sizing: border-box;
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 48px 28px 28px 34px;
    }

    .panel {
      display: block;
    }

    .panel .panel-content {
      min-height: 360px;
      margin-left: 40%;
    }

    .panel .scene-stage {
      width: 40%;
    }

    .title {
      font-size: clamp(18px, 5.5cqi, 23px);
      font-weight: 700;
      line-height: 1.35;
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
        background: var(--scene-backdrop-base);
      }

      .panel-content {
        padding: 26px 20px 20px;
      }

      .panel .scene-stage {
        width: 100%;
        height: 190px;
      }

      .panel .scene-character {
        --scene-character-max-width: 184px;
      }

      .panel .panel-content {
        min-height: 0;
        margin-top: 190px;
        margin-left: 0;
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
