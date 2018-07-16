// バックグラウンド

// ツールバーのボタン押下時
chrome.browserAction.onClicked.addListener(function (tab) {
    // コンテンツからのコールバック
    function callback(content) {
        // 特になし
    }
    // Contentスクリプトへメッセージ送信
    chrome.tabs.sendMessage(tab.id, { text: 'report_back' }, callback);
});