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

        // 再生されてる可能性があるので止める
        speechSynthesis.cancel();
        $play.innerText = "⏵";

        // ボタン押下
        $play.addEventListener('click', () => {
            if (speechSynthesis.speaking) {
                // 再生中

                // 止めて再生ボタン表示
                speechSynthesis.cancel();
                $play.innerText = "⏵";
            } else {
                // 停止中

                // 再生して停止ボタン表示
                let speech = new SpeechSynthesisUtterance();
                var text = $src.value;

                // 変な読み方をされる記号は読み上げない。
                text = text.replace(/(\{|\}|\<|\>|⇒|;|\/)/g, ' ');
                text = text.replace(/[\r|\n]/g, ' ');
                text = text.replace(/ +/g, ' ');

                speech.text = text;
                speech.rate = $(".speed:checked").value;
                speech.lang = 'ja-JP';
                speechSynthesis.speak(speech);
                $play.innerText = "■";
            }
        });
    }
}
