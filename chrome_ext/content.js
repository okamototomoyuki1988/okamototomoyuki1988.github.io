// コンテンツ側

// バックエンドからの呼び出し時
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (window.speechSynthesis.speaking) {
    // 音声停止
    window.speechSynthesis.cancel();
  } else {
    // 未再生
    // DOMがあれば再生
    let obj = document.querySelector("object")
    if (obj !== null) {
      let dom = obj.contentDocument.querySelector(".body_content")
      if (dom != null) {
        let speech = new SpeechSynthesisUtterance();
        speech.text = dom.innerText;
        speech.rate = 4;
        speech.lang = 'ja-JP';
        window.speechSynthesis.speak(speech);
      }
    }
  }
});