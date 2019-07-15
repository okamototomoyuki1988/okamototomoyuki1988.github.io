window.onload = async () => {

    const url = new URL(location.href);
    const params = url.searchParams;
    const pId = params.get("id");
    const pHpd = params.get("hpd");

    if (pId === null)
        throw new Error("パラメータを入力してください。");

    const hpd = pHpd != null ? Number(pHpd) : 6;

    const db = firebase.firestore();
    const docRef = db.collection(FS_COL).doc(pId);

    class Content {
        constructor() {
            this.text = "";
            this.rows = [];
        }

        load(obj) {
            this.text = obj.text;
        }

        equals(other) { return this.text == other.text; }

        clone() {
            const content = new Content();
            content.text = this.text;
            return content;
        }

        get object() {
            const obj = {};
            obj.text = this.text;
            return obj;
        }
    }

    class Row {
        constructor() {
            this.text = null;

            this.from = null;
            this.to = null;
        }

        load(obj) {
            this.text = obj.text;
        }

        equals(other) {
            this.text == other.text;
        }

        clone() {
            const row = new Row();
            row.text = this.text;
            return row;
        }

        get object() {
            return {
                text: this.text,
            };
        }
    }

    const $days = $(".days");
    const $keys = $(".keys");
    const $datas = $(".datas");

    const $text = $("textarea");
    const $textdiv = $("div.text");

    $datas.scroll(e => {
        $keys.scrollTop($datas.scrollTop());
        $days.scrollLeft($datas.scrollLeft());
    });

    let content = null;

    const res = await fetch('https://holidays-jp.github.io/api/v1/date.json');
    const holidayDic = await res.json();

    const _read = async () => {
        let doc = await docRef.get();
        content = new Content();
        if (doc.exists) {
            content.load(doc.data().content)
        }
    }
    await _read();
    $text.val(content.text);

    const _key = (e, query) =>
        false == (query.includes("#") && e.shiftKey == false
            || query.includes("%") && e.ctrlKey == false
            || query.includes("&") && e.altKey == false
            || query.includes(e.key) == false);


    $("html").keydown(async e => {
        // if (_key(e, "%0")
        //     || _key(e, "%1")
        //     || _key(e, "%2")
        //     || _key(e, "%3")
        //     || _key(e, "%4")
        //     || _key(e, "%5")
        //     || _key(e, "%6")
        //     || _key(e, "%7")
        //     || _key(e, "%8")
        //     || _key(e, "%9")
        // ) {
        //     let startLine = $text.val().substr(0, $text[0].selectionStart).split("\n").length;
        //     let endLine = $text.val().substr(0, $text[0].selectionEnd).split("\n").length;
        //     console.log(e.key + " " + startLine + " " + endLine);
        //     for (let i = startLine - 1; i < endLine; i++) {
        //         content.rows[i].hour = Number(content.rows[i].hour + e.key.replace(/\D/, ""));
        //     }
        //     e.preventDefault();
        //     return false;
        // }

        return true;
    });

    const render = async () => {
        $days.empty();
        $keys.find("div:not(.text)").remove();
        $datas.empty();

        let today = moment({ hour: 0, minute: 0, seconds: 0, milliseconds: 0 });
        let addDay = 0;

        const lines = content.text.split(/\r?\n/);
        content.rows = [];
        for (const line of lines) {
            const row = new Row();
            row.text = line;
            content.rows.push(row);
        }

        let linenum = content.rows.length + 1;
        $textdiv.css("grid-row-end", linenum);
        $text.css("height", linenum * 1.5 + "em");

        for (const row of content.rows) {
            row.from = today.clone().add(addDay, "days");

            const rowNum = row.text.replace(/^.*[\s　]([0-9０-９]+[\.．]?[0-9０-９]*)$/, "$1")
            const num = Number(rowNum.replace("．", ".").replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 65248)));

            if (Number.isNaN(num) == false)
                addDay += num / hpd;
            row.to = today.clone().add(addDay, "days");
        }
        let lastDay = today.clone().add(addDay, "days").clone();

        let colDay = today.clone();
        while (colDay.isSameOrBefore(lastDay)) {
            const $day = $("<div>");
            $day.text(colDay.format("DD"));
            $days.append($day);
            let color = null;
            if (colDay.day() == 0 || colDay.day() == 6 || holidayDic[colDay.format("YYYY-MM-DD")])
                color = "#A6A";
            else if (colDay.day() % 2 == 0)
                color = "#442";
            else
                color = "#244";

            $day.css("background-color", color);
            colDay.add(1, "days");
        }

        for (const i in content.rows) {
            const row = content.rows[i];

            const $ck = $(`<input type='checkbox'/>`);
            $ck.click(() => check(i));
            const $ckdiv = $(`<div>`);
            $ckdiv.append($ck);
            $keys.append($ckdiv);

            const $rowdiv = $(`<div class="row">`);
            $datas.append($rowdiv);

            let tdDay = today.clone();
            while (tdDay.isSameOrBefore(lastDay)) {
                const $data = $("<div>");
                $rowdiv.append($data);
                if (tdDay.isSameOrAfter(row.from) && tdDay.isSameOrBefore(row.to))
                    $data.html("●");
                else
                    $data.html("&nbsp;");

                let color = null;
                if (tdDay.day() == 0 || tdDay.day() == 6 || holidayDic[tdDay.format("YYYY-MM-DD")])
                    color = i % 2 == 0 ? "#ede" : "#dcd";
                else if (tdDay.day() % 2 == 0)
                    color = i % 2 == 0 ? "#eed" : "#ddc";
                else
                    color = i % 2 == 0 ? "#dee" : "#cdd";

                $data.css("background-color", color);
                tdDay.add(1, "days");
            }
        }
    }

    const check = async (index) => {
        content.rows.splice(index, 1);
        reloadText();
    }

    const push = async () => {
        console.log(content.object);
        await docRef.set({ "content": content.object, "date": Date.now() });
    }

    let now = Date.now();
    let prevSave = null;
    let prevRender = null;
    while (true) {
        const text = $text.val();
        if (content.text == null || content.text != $text.val()) {
            content.text = text;
        }

        if (prevRender == null || content.equals(prevRender) == false) {
            prevRender = content.clone();
            render();
        }

        if (Date.now() - now > 1500) {
            if (prevSave == null || content.equals(prevSave) == false) {
                prevSave = content.clone();
                now = Date.now();
                push();
            }
        }
        await waitNext();
    }
}