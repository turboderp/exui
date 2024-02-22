
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
    promptFormatsOptions: null,
    smoothScrolling: true,

}

//  Global state from packet

export function receiveGlobals(response) {
    if (response.current_model) g.loadedModelUUID = response.current_model;
    if (response.current_session) g.currentSessionUUID = response.current_model;
    if (response.prompt_formats) {
        g.promptFormats = [];
        g.promptFormatsOptions = {};
        for (let i = 0; i < response.prompt_formats.length; i++)
        {
            let name = response.prompt_formats[i].name;
            g.promptFormats.push(name);
            g.promptFormatsOptions[name] = response.prompt_formats[i];
        }
    }
}