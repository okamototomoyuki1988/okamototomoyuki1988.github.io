window.onload = async () => {

    let _updates = [];

    const _animationFrame = () => {
        return new Promise(resolve => window.requestAnimationFrame((timestamp) => resolve(timestamp)));
    }
    const _routine = async () => {
        while (true) {
            var delta = await _animationFrame();
            for (let _update of _updates) {
                await _update(delta);
            }
        }
    }
    _routine();

    {
        const $ = (query) => document.querySelector(".todo").querySelector(query);
        const _COL = "todos";

        const url = new URL(location.href);
        const params = url.searchParams;
        const pId = params.get("name");
        const pPrj = params.get("prj");

        const $text = $(".text");

        if (pId === null || pPrj === null) {
            $text.value = "パラメータを入力してください。";
            return;
        }

        const db = firebase.firestore();
        const docRef = db.collection(_COL).doc(pId);

        let src = null;
        const doc = await docRef.get();
        if (doc.exists) {
            src = doc.data().text;
        }

        const res = await fetch('https://holidays-jp.github.io/api/v1/date.json');
        const json = await res.json();

        const rows = [];
        for (let line of src.split(/\r?\n/)) {
            let row = {};
            let wk = null;

            wk = line.replace(/^(x|ｘ)/, "")
            row.isComplete = line !== wk;

            let hourStr = wk.replace(/^.*[\s　]([0-9０-９]*[\.．]?[0-9０-９]+)$/, "$1");
            hourStr = hourStr.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 65248));
            hourStr = hourStr.replace("．", ".");
            row.hour = Number(hourStr);
            rows.push(row);
        }
    }
}
