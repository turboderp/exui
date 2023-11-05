
export const g = {

    // Model state

    loadedModelUUID: null,
    failedModelUUID: null,
    failedModelError: null,

    // Session state

    currentSessionUUID: null,
    currentSettings: null,

    // Streaming state

    currentStreamingBlock: null,

    // ..

    promptFormats: null,
    smoothScrolling: true,

}

//  Global state from packet

export function receiveGlobals(response) {
    if (response.current_model) g.loadedModelUUID = response.current_model;
    if (response.current_session) g.currentSessionUUID = response.current_model;
    if (response.prompt_formats) g.promptFormats = response.prompt_formats;
}