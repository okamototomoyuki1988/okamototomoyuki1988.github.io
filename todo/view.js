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
        const _COL = "todos";

        const url = new URL(location.href);
        const params = url.searchParams;
        const pId = params.get("id");
        const pHpd = params.get("hpd");

        if (pId === null)
            throw new Error("パラメータを入力してください。");

        const hpd = pHpd != null ? Number(pHpd) : 6;

        const db = firebase.firestore();
        const docRef = db.collection(_COL).doc(pId);

        let dataText = null;
        let doc = await docRef.get();
        if (doc.exists)
            dataText = doc.data().text;

        const res = await fetch('https://holidays-jp.github.io/api/v1/date.json');
        const holidayDic = await res.json();

        class Row {
        }

        const render = async () => {
            const $thead = $("thead");
            const $tbody = $("tbody");

            $thead.find("th:not(.blank)").remove();
            $tbody.empty();

            const rows = [];
            for (const line of dataText.split(/\r?\n/)) {
                const row = new Row();
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
                if (row.isComplete == false) {
                    row.from = rowDay.clone();
                    addDay = Math.round(row.hour / hpd);
                    rowDay.add(addDay, "days");
                    row.to = rowDay.clone();
                }
            }
            let lastDay = rowDay.clone();

            const $ths = $(".ths");
            let colDay = today.clone();
            while (colDay.isSameOrBefore(lastDay)) {
                const $th = $("<th>");
                $th.text(colDay.format("DD"));
                $ths.append($th);
                let color = null;
                if (colDay.day() == 0 || colDay.day() == 6 || holidayDic[colDay.format("YYYY-MM-DD")])
                    color = "#A6A";
                else if (colDay.day() % 2 == 0)
                    color = "#442";
                else
                    color = "#244";

                $th.css("background-color", color);
                colDay.add(1, "days");
            }

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];

                const $tr = $("<tr>");
                $tbody.append($tr);
                if (row.isComplete) {
                    $tr.css("display", "none");
                }
                const $th = $("<th>");
                $tr.append($th);
                const $ck = $("<input>").attr("type", "checkbox");
                $th.append($ck);
                $ck.click(() => check(i));
                $th.append(row.name);
                $th.css("background-color", i % 2 == 0 ? "#eee" : "#ddd");

                let tdDay = today.clone();
                while (tdDay.isSameOrBefore(lastDay)) {
                    const $td = $("<td>");
                    $tr.append($td);
                    if (tdDay.isSameOrAfter(row.from) && tdDay.isSameOrBefore(row.to))
                        $td.html("●");
                    else
                        $td.html("&nbsp;");

                    let color = null;
                    if (tdDay.day() == 0 || tdDay.day() == 6 || holidayDic[tdDay.format("YYYY-MM-DD")])
                        color = i % 2 == 0 ? "#ede" : "#dcd";
                    else if (tdDay.day() % 2 == 0)
                        color = i % 2 == 0 ? "#eed" : "#ddc";
                    else
                        color = i % 2 == 0 ? "#dee" : "#cdd";

                    $td.css("background-color", color);
                    tdDay.add(1, "days");
                }
            }
        }
        render();

        const check = async (index) => {
            const lines = dataText.split(/\r?\n/);
            const newlines = [];
            for (let i = 0; i < lines.length; i++) {
                if (i == index)
                    newlines.push("x" + lines[i]);
                else
                    newlines.push(lines[i]);
            }
            const newData = newlines.join("\n");
            await docRef.set({ "text": newData, "date": Date.now() });

            doc = await docRef.get();
            if (doc.exists)
                dataText = doc.data().text;

            render();
        }
    }
}