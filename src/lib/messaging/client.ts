import { isBackgroundErrorResponse } from "./contracts.js";
import type {
    BackgroundRequestOf,
    BackgroundRequestType,
    BackgroundSuccessResponse,
    ContentRequestOf,
    ContentRequestType,
    ContentResponse,
} from "./contracts.js";

export async function sendBackgroundMessage<
    TType extends BackgroundRequestType,
>(
    message: BackgroundRequestOf<TType>,
): Promise<BackgroundSuccessResponse<TType>> {
    const response = (await chrome.runtime.sendMessage(message)) as unknown;
    if (isBackgroundErrorResponse(response)) {
        throw new Error(response.error);
    }

    return response as BackgroundSuccessResponse<TType>;
}

export async function sendContentMessage<TType extends ContentRequestType>(
    tabId: number,
    message: ContentRequestOf<TType>,
): Promise<ContentResponse<TType>> {
    return chrome.tabs.sendMessage(tabId, message) as Promise<
        ContentResponse<TType>
    >;
}
