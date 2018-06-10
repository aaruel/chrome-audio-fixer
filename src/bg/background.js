chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        chrome.pageAction.show(sender.tab.id);
        sendResponse();
    }
)

class TabInfo {
    constructor(actx = null, started = false, stream = null, source = null) {
        this.actx = actx
        this.started = started
        this.stream = stream
        this.source = null
        this.channels = {0: null, 1: null}
    }

    // Getter / Setters
    setContext(actx) { this.actx = actx }
    setStream(stream) { this.stream = stream }
    setSource(source) { this.source = source}
    isStarted() { return this.started }
    getStream() { return this.stream }
    getContext() { return this.actx }

    // Methods
    start() {
        this.started = true
    }

    stop() {
        this.stream.getAudioTracks()[0].stop()
        this.actx.close()
        this.started = false
    }

    setup() {
        this.channels = {
            0: this.actx.createAnalyser(),
            1: this.actx.createAnalyser()
        }
        const splitter = this.actx.createChannelSplitter()
        this.source.connect(splitter)
        splitter.connect(this.channels[0], 0)
        splitter.connect(this.channels[1], 1)
    }

    pushNodeToChannel(node, channel) {
        /**
         * Approach fixing stream as a dynamic pipeline,
         * connect node or beginning of chain node to last established
         * node
         */
        
    }

    passthroughState() {
        /**
         * Reset IO stream into default passthrough state (no processing)
         */
        this.actx.disconnect()
        this.source.connect(this.actx.destination)
    }

    diagnoseMonoSplit(channel) {
        /**
         * If one stereo channel is silent when the original 
         * signal is mono, connect the working mono channel to both
         * stereo output channels
         */
        const splitter = this.actx.createChannelSplitter(2)
        const merger = this.actx.createChannelMerger(2)
        this.source.connect(splitter)
        splitter.connect(merger, channel, 1)
        splitter.connect(merger, channel, 0)
        merger.connect(this.actx.destination)
    }

    checkChannelSilent() {

    }
}

let gTabs = {}

const queryTab = (tabs) => {
    const id = tabs[0].id
    if (!gTabs[id]) gTabs[id] = new TabInfo()
    return gTabs[id]
}

const startProcessing = (tabRef) => {
    chrome.tabCapture.capture({audio: true}, (stream) => {
        // Must be done in this order (for some reason) //
        //\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//
        actx = new AudioContext()
        tabRef.start()
        tabRef.setContext(actx)
        tabRef.setStream(stream)
        tabRef.setSource(actx.createMediaStreamSource(stream))
        tabRef.setup()
        //\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//
        tabRef.diagnoseMonoSplit(0)
    })
}

const toggleMonitor = () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const tabRef = queryTab(tabs)
        if (!tabRef.isStarted()) startProcessing(tabRef)
        else tabRef.stop()
    })
}

const print = (value) => {
    const type = "print"
    chrome.runtime.sendMessage({type, value})
}

chrome.runtime.onMessage.addListener((request) => {
    if (request === "start") {
        toggleMonitor()
    }
})
