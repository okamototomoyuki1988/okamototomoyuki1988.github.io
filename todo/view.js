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
            this.rows = [];
        }

        load = (obj) => {
            this.rows = [];
            for (const ele of obj.rows) {
                const row = new Row();
                row.load(ele);
                this.rows.push(row);
            }
        }

        equals = (other) => {
            if (this.rows.length != other.rows.length)
                return false;

            for (const i in this.rows)
                if (!this.rows[i].equals(other.rows[i]))
                    return false;
            return true;
        }

        clone = () => {
            const content = new Content();
            for (const row of this.rows) {
                content.rows.push(row.clone());
            }
            return content;
        }

        get object() {
            const obj = {};
            obj.rows = [];
            for (const row of this.rows) {
                obj.rows.push(row.object);
            }
            return obj;
        }
    }

    class Row {
        constructor() {
            this.text = null;
            this.hour = 0;
            this.isNest = false;

            this.from = null;
            this.to = null;
        }

        load = (obj) => {
            this.text = obj.text;
            this.hour = obj.hour;
            this.isNest = obj.isNest;
        }

        equals = (other) =>
            this.text == other.text
            && this.hour == other.hour
            && this.isNest == other.isNest;

        clone = () => {
            const row = new Row();
            row.text = this.text;
            row.hour = this.hour;
            row.isNest = this.isNest;

            row.from = this.from != null ? this.from.clone() : null;
            row.to = this.to != null ? this.to.clone() : null;
            return row;
        }

        get object() {
            return {
                text: this.text,
                hour: this.hour,
                isNest: this.isNest,
            };
        }
    }

    const $days = $(".days");
    const $keys = $(".keys");
    const $datas = $(".datas");

    const $text = $("textarea");
    const $textdiv = $("div.text");

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

    const _key = (e, query) =>
        false == (query.includes("#") && e.shiftKey == false
            || query.includes("%") && e.ctrlKey == false
            || query.includes("&") && e.altKey == false
            || query.includes(e.key) == false);


    $("html").keydown(async e => {
        if (_key(e, "%0")
            || _key(e, "%1")
            || _key(e, "%2")
            || _key(e, "%3")
            || _key(e, "%4")
            || _key(e, "%5")
            || _key(e, "%6")
            || _key(e, "%7")
            || _key(e, "%8")
            || _key(e, "%9")
        ) {
            let startLine = $text.val().substr(0, $text[0].selectionStart).split("\n").length;
            let endLine = $text.val().substr(0, $text[0].selectionEnd).split("\n").length;
            console.log(e.key + " " + startLine + " " + endLine);
            for (let i = startLine - 1; i < endLine; i++) {
                content.rows[i].hour = Number(content.rows[i].hour + e.key.replace(/\D/, ""));
            }
            e.preventDefault();
            return false;
        }
        else if (_key(e, "%Delete")) {
            let startLine = $text.val().substr(0, $text[0].selectionStart).split("\n").length;
            let endLine = $text.val().substr(0, $text[0].selectionEnd).split("\n").length;
            console.log(e.key + " " + startLine + " " + endLine);
            for (let i = startLine - 1; i < endLine; i++) {
                content.rows[i].hour = 0;
            }
            e.preventDefault();
            return false;
        }

        return true;
    });

    const reloadText = () => {
        const texts = [];
        for (const row of content.rows) {
            texts.push(row.text);
        }
        $text.val(texts.join("\n"));
    }
    reloadText();

    const render = async () => {
        $days.empty();
        $keys.find("div:not(.text)").remove();
        $datas.empty();

        let linenum = content.rows.length + 1;
        $textdiv.css("grid-row-end", linenum);
        $text.css("height", linenum * 24.5 + "px");

        let today = moment({ hour: 0, minute: 0, seconds: 0, milliseconds: 0 });
        let rowDay = today.clone();
        let addDay = 0;
        for (let row of content.rows) {
            row.from = rowDay.clone();
            addDay = Math.round(row.hour / hpd);
            rowDay.add(addDay, "days");
            row.to = rowDay.clone();
        }
        let lastDay = rowDay.clone();

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

            const $h = $(`<input type='text'/>`);
            $h.val(row.hour);
            $h.on('input', () => {
                let num = Number($h.val());
                row.hour = Number.isNaN(num) ? 0 : num;
            });
            const $hdiv = $(`<div>`);
            $hdiv.append($h);
            $keys.append($hdiv);

            let tdDay = today.clone();
            while (tdDay.isSameOrBefore(lastDay)) {
                const $data = $("<div>");
                $datas.append($data);
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

            const $data = $("<div class='newline'></div>");
            $datas.append($data);
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
    let prevStart = -1;
    let prevEnd = -1;
    let prevText = null;
    let prevSave = null;
    let prevRender = null;
    while (true) {
        if (prevText == null || prevText != $text.val()) {
            const text = $text.val();
            const lines = text.split(/\r?\n/);

            if (prevText != null) {
                let currentStart = $text[0].selectionStart;
                let currentStartLine = text.substr(0, currentStart).split("\n").length - 1;
                let prevStartLine = prevText.substr(0, prevStart).split("\n").length - 1;
                let prevEndLine = prevText.substr(0, prevEnd).split("\n").length - 1;

                if (lines.length != content.rows.length)
                    if (prevStartLine != prevEndLine) {
                        for (let i = prevStartLine + 1; i <= prevEndLine; i++)
                            content.rows.splice(prevStartLine + 1, 1);
                    } else if (lines.length < content.rows.length) {
                        if (currentStartLine == prevStartLine) {
                            content.rows.splice(prevStartLine + 1, 1);
                        } else {
                            content.rows.splice(prevStartLine, 1);
                        }
                    }

                const addNum = lines.length - content.rows.length;
                for (let i = 0; i < addNum; i++)
                    content.rows.splice(prevStartLine + 1, 0, new Row());
            }

            for (const i in lines)
                content.rows[i].text = lines[i];

            prevText = text;
        }
        prevStart = $text[0].selectionStart;
        prevEnd = $text[0].selectionEnd;

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