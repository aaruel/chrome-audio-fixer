document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("start")
    startButton.onclick = () => {
        chrome.runtime.sendMessage("start")
    }
})
