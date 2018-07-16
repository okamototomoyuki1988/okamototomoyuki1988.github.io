// コンテンツ側

// バックエンドからの呼び出し時
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  // 音声一旦停止
  window.speechSynthesis.cancel();

  // 0.1秒後再生 ※停止フレームでは再生できないため
  setTimeout(function () {
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
  }, 100);
});