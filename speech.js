// ファイルリストに拡張メソッド
window.onload = () => {

    // speech
    {
        // クエリショートカット
        const $ = (query) => document.querySelector("#speech").querySelector(query);
        let $play = $(".play");
        let $src = $(".src");

        const _KEY_SAVE_SRC = "speech_src";

        // 前回のテキスト読込
        let saveSrc = localStorage.getItem(_KEY_SAVE_SRC);
        $src.value = saveSrc;
        // 変更したら保存機能
        $src.addEventListener('change', () => {
            localStorage.setItem(_KEY_SAVE_SRC, $src.value);
        });

        // 再生機能
        let speech = null;
        $play.addEventListener('click', () => {
            if (speech !== null)
            {
                speech = new SpeechSynthesisUtterance();                
            }
            speech.text = $src.value;
            speech.rate = $(".speed:checked").value;
            speech.lang = 'ja-JP';
            speechSynthesis.speak(speech);
        });
    }
}
