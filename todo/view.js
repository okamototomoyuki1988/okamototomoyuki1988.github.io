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

        load(obj) {
            this.rows = [];
            for (const ele of obj.rows) {
                const row = new Row();
                row.load(ele);
                this.rows.push(row);
            }
        }

        equals(other) {
            if (this.rows.length != other.rows.length)
                return false;

            for (const i in this.rows)
                if (!this.rows[i].equals(other.rows[i]))
                    return false;
            return true;
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
            this.isComplete = false;
            this.text = null;
            this.hour = 0;
            this.isNest = false;

            this.from = null;
            this.to = null;
        }

        load = (obj) => {
            const row = new Row();
            row.isComplete = obj.isComplete;
            row.text = obj.text;
            row.hour = obj.hour;
            row.isNest = obj.isNest;
        }

        equals = (other) =>
            this.isComplete == other.isComplete
            && this.text == other.text
            && this.hour == other.hour
            && this.isNest == other.isNest;

        get object() {
            return {
                isComplete: this.isComplete,
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

    $('html').keydown(async e => {
        if (_key(e, "o")) {
            content.rows.push(new Row());
            await push();

            render();
            return false;
        }
        return true;
    });

    const reloadText = () => {
        let text = "";
        for (const row of content.rows) {
            if (row.isComplete  == false)
                text += row.text + "\n";
        }
        $text.val(text);
    }
    reloadText();

    $text.on("input", (e) => {
        const lines = $text.val().split(/\r?\n/);
        for (const i in lines)
            content.rows[i].text = lines[i];
    });

    const render = async () => {
        $days.empty();
        $keys.find("div:not(.text)").remove();
        $datas.empty();

        let today = moment({ hour: 0, minute: 0, seconds: 0, milliseconds: 0 });
        let rowDay = today.clone();
        let addDay = 0;
        for (let row of content.rows) {
            if (row.isComplete == false) {
                row.from = rowDay.clone();
                addDay = Math.round(row.hour / hpd);
                rowDay.add(addDay, "days");
                row.to = rowDay.clone();
            }
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

        let count = 1;
        for (const i in content.rows) {
            const row = content.rows[i];
            if (row.isComplete)
                continue;
            count++;

            const $ck = $(`<input type='checkbox'/>`);
            $ck.click(() => check(i));
            const $ckdiv = $(`<div>`);
            $ckdiv.append($ck);
            $keys.append($ckdiv);

            const $h = $(`<input type='text'/>`);
            $h.val(row.hour);
            $h.on('input', () => row.hour = $h.val());
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

        scaleTextarea();
    }

    const scaleTextarea = () => {
        let linenum = content.rows.length + 1;
        $textdiv.css("grid-row-end", linenum);
        $text.css("height", linenum * 24.5 + "px");
    }

    const check = async (index) => {
        content.rows[index].isComplete = true;
        reloadText();
        render();
    }

    const push = async () => {
        await docRef.set({ "content": content.object, "date": Date.now() });
    }

    render();
}