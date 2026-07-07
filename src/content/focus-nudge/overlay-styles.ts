import {TOAST_AUTO_DISMISS_MS} from "./constants";

export const TOAST_OVERLAY_STYLES = `
      :host {
        all: initial;
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 2147483647;
        width: min(450px, calc(100vw - 32px));
        box-sizing: border-box;
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        pointer-events: auto;
        animation: toast-in 220ms ease-out both;
      }

      .toast {
        position: relative;
        box-sizing: border-box;
        overflow: hidden;
        width: 100%;
        display: flex;
        border: 1px solid rgba(3, 2, 19, 0.12);
        border-radius: 16px;
        background: #ffffff;
        color: #030213;
        box-shadow: 0 18px 42px rgba(3, 2, 19, 0.18);
      }

      .progress {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        overflow: hidden;
        background: #ececf0;
      }

      .progress-value {
        width: 100%;
        height: 100%;
        background: rgba(3, 2, 19, 0.4);
        transform-origin: left center;
        animation: progress-out `+TOAST_AUTO_DISMISS_MS.toString()+`ms linear both;
      }

      .header {
        display: flex;
        align-items: stretch;
        width: 100%;
        min-height: 164px;
      }

      .thumb {
        position: relative;
        flex: 0 0 150px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 150px;
        min-height: 164px;
        overflow: hidden;
        background: #ececf0;
        color: #030213;
        font-size: 32px;
        font-weight: 700;
        line-height: 1;
      }

      .thumb::after {
        position: absolute;
        inset: auto 0 0;
        height: 40px;
        content: "";
        background: linear-gradient(to top, rgba(0, 0, 0, 0.18), transparent);
        pointer-events: none;
      }

      .thumb-image {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: top center;
      }

      .content {
        min-width: 0;
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        padding: 16px 16px 16px;
      }

      .top-row {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 12px;
      }

      .copy {
        min-width: 0;
        flex: 1 1 auto;
      }

      .title {
        margin: 0;
        color: #030213;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0;
        line-height: 1.35;
      }

      .site {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        margin-top: 4px;
        color: #717182;
        font-size: 12px;
        font-weight: 400;
        line-height: 1.35;
      }

      .site-icon {
        display: block;
        width: 12px;
        height: 12px;
        flex: 0 0 auto;
        color: #d97706;
      }

      .site-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .close {
        flex: 0 0 auto;
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: -3px -3px 0 0;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: #717182;
        cursor: pointer;
        padding: 0;
      }

      .close:hover:not(:disabled) {
        background: #e9ebef;
        color: #030213;
      }

      .actions {
        display: grid;
        gap: 6px;
        margin-top: auto;
      }

      .button {
        box-sizing: border-box;
        width: 100%;
        border: 0;
        border-radius: 8px;
        cursor: pointer;
        font: inherit;
        letter-spacing: 0;
        line-height: 1.35;
        transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease;
      }

      .button:disabled,
      .close:disabled {
        cursor: default;
        opacity: 0.62;
      }

      .primary {
        min-height: 36px;
        padding: 8px 12px;
        background: #030213;
        color: #ffffff;
        font-size: 14px;
        font-weight: 500;
      }

      .primary:hover:not(:disabled) {
        background: rgba(3, 2, 19, 0.9);
      }

      .secondary,
      .tertiary {
        min-height: 32px;
        padding: 7px 10px;
        font-size: 12px;
        font-weight: 500;
      }

      .secondary {
        background: #ececf0;
        color: #030213;
      }

      .secondary:hover:not(:disabled),
      .tertiary:hover:not(:disabled) {
        background: #e9ebef;
        color: #030213;
      }

      .tertiary {
        background: transparent;
        color: #717182;
      }

      .status {
        min-height: 0;
        margin: 0;
        color: #b42318;
        font-size: 12px;
        line-height: 1.4;
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
    `;

export const FULLSCREEN_OVERLAY_STYLES = `
    :host {
      all: initial;
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(6px);
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      pointer-events: auto;
      animation: overlay-fade-in 300ms ease-out both;
    }

    .panel {
      box-sizing: border-box;
      position: relative;
      display: flex;
      width: min(100%, 544px);
      min-height: 320px;
      overflow: hidden;
      padding: 0;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 16px;
      background: #ffffff;
      color: #030213;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.28);
      text-align: left;
      animation: panel-zoom-in 300ms ease-out both;
    }

    .close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: #717182;
      cursor: pointer;
      padding: 0;
      transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease;
    }

    .close:hover:not(:disabled) {
      background: #e9ebef;
      color: #030213;
    }

    .image-wrap {
      position: relative;
      flex: 0 0 224px;
      display: flex;
      align-items: stretch;
      justify-content: center;
      margin: 0;
      overflow: hidden;
      background: #ececf0;
    }

    .image-wrap::after {
      position: absolute;
      inset: auto 0 0;
      height: 64px;
      content: "";
      background: linear-gradient(to top, rgba(0, 0, 0, 0.22), transparent);
      pointer-events: none;
    }

    .image {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
    }

    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 320px;
      font-size: 64px;
      font-weight: 700;
      line-height: 1;
    }

    .avatar-violet { background: #f1edff; color: #6d28d9; }
    .avatar-blue { background: #eaf2ff; color: #1d4ed8; }
    .avatar-emerald { background: #e7f8ef; color: #047857; }
    .avatar-rose { background: #fff0f3; color: #be123c; }
    .avatar-stone { background: #f1f1ef; color: #57534e; }
    .avatar-cyan { background: #e8f8fb; color: #0e7490; }
    .avatar-amber { background: #fff7df; color: #b45309; }
    .avatar-green { background: #ebf8ed; color: #15803d; }
    .avatar-indigo { background: #eef2ff; color: #4338ca; }
    .avatar-gray { background: #f0f1f4; color: #4b5563; }

    .panel-content {
      box-sizing: border-box;
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 32px 24px;
    }

    .title {
      margin: 0 0 8px;
      color: #030213;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: 0;
      line-height: 1.15;
    }

    .site {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-sizing: border-box;
      max-width: 100%;
      align-self: flex-start;
      margin: 8px 0 24px;
      padding: 6px 12px;
      border-radius: 8px;
      background: #ececf0;
      color: #717182;
      font-size: 12px;
      font-weight: 400;
      line-height: 1.35;
    }

    .site-icon {
      display: block;
      width: 14px;
      height: 14px;
      flex: 0 0 auto;
      color: #d97706;
    }

    .site-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      display: grid;
      gap: 8px;
      width: 100%;
    }

    .button {
      box-sizing: border-box;
      width: 100%;
      min-height: 48px;
      border: 0;
      border-radius: 8px;
      cursor: pointer;
      font: inherit;
      font-size: 16px;
      font-weight: 500;
      letter-spacing: 0;
      line-height: 1.5;
      padding: 12px 16px;
      text-align: center;
      transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease;
    }

    .button:disabled,
    .close:disabled {
      cursor: default;
      opacity: 0.62;
    }

    .primary {
      background: #030213;
      color: #ffffff;
    }

    .primary:hover:not(:disabled) {
      background: rgba(3, 2, 19, 0.9);
    }

    .secondary {
      background: #ececf0;
      color: #030213;
    }

    .secondary:hover:not(:disabled) {
      background: rgba(236, 236, 240, 0.8);
    }

    .tertiary {
      min-height: 44px;
      background: transparent;
      color: #717182;
      font-size: 14px;
    }

    .tertiary:hover:not(:disabled) {
      background: #e9ebef;
      color: #030213;
    }

    .status {
      min-height: 18px;
      margin: 14px 0 0;
      color: #b42318;
      font-size: 13px;
      line-height: 1.45;
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

    @media (max-width: 480px) {
      .panel {
        flex-direction: column;
        min-height: 0;
      }

      .image-wrap,
      .avatar {
        min-height: 180px;
      }

      .image-wrap {
        flex-basis: 180px;
      }

      .panel-content {
        padding: 28px 24px 24px;
      }

      .title {
        font-size: 22px;
      }

    }
  `;
