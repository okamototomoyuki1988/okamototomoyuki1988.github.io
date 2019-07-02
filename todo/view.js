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
        const pId = params.get("id");
        const pHpd = params.get("hpd");

        if (pId === null || pHpd === null) {
            throw new Error("パラメータを入力してください。");
        }

        const hpd = Number(pHpd);

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
        for (const line of src.split(/\r?\n/)) {
            const row = {};
            let wk = null;

            wk = line.replace(/^(x|ｘ)/, "")
            row.isComplete = line !== wk;

            let name = wk.replace(/^(.*)[\s　]([0-9０-９]*[\.．]?[0-9０-９]+)$/, "$1");
            row.name = name;

            let hourStr = wk.replace(/^.*[\s　]([0-9０-９]*[\.．]?[0-9０-９]+)$/, "$1");
            hourStr = hourStr.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 65248));
            hourStr = hourStr.replace("．", ".");
            row.hour = Number(hourStr);
            rows.push(row);
        }

        let today = moment({ hour: 0, minute: 0, seconds: 0, milliseconds: 0 });
        let rowDay = today.clone();
        let addDay = 0;
        for (let row of rows) {
            addDay = Math.round(row.hour / hpd);
            rowDay.add(addDay, "days");
            row.end = today.clone();
        }
        let lastDay = rowDay.clone();

        const $ths = $(".ths");
        let colDay = today.clone();
        while (colDay.isSameOrBefore(lastDay)) {
            const $th = document.createElement("th");
            $th.innerText = colDay.format("DD");
            $ths.appendChild($th);
            colDay.add(1, "days");
        }

        const $body = $("tbody");
        for (let row of rows) {
            const $tr = document.createElement("tr");
            $body.appendChild($tr);
            const $th = document.createElement("th");
            $tr.appendChild($th);
            $th.innerText = row.name;

            let tdDay = today.clone();
            while (tdDay.isSameOrAfter(row.end) && tdDay.isSameOrBefore(row.end)) {
                const $td = document.createElement("td");
                $tr.appendChild($td);
                $td.innerText = "●";
                tdDay.add(1, "days");
            }
        }
    }
}