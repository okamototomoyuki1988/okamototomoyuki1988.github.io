window.onload = async () => {

    const url = new URL(location.href);
    const params = url.searchParams;
    const pId = params.get("id");

    if (pId === null)
        throw new Error("パラメータを入力してください。");

    const db = firebase.firestore();
    const docRef = db.collection(FS_COL).doc(pId);

    class Content {
        constructor() {
            this.text = "";
            this.hpd = 6;
            this.workWeek = true;
            this.workHoli = false;
            this.rows = [];
        }

        load(obj) {
            this.text = obj.text !== undefined ? obj.text : this.text;
            this.hpd = obj.hpd !== undefined ? obj.hpd : this.hpd;
            this.workWeek = obj.workWeek === true ? true : false;
            this.workHoli = obj.workHoli === true ? true : false;
        }

        equals(other) {
            return this.text == other.text
                && this.hpd == other.hpd
                && this.workWeek == other.workWeek
                && this.workHoli == other.workHoli;
        }

        clone() {
            const content = new Content();
            content.text = this.text;
            content.hpd = this.hpd;
            content.workWeek = this.workWeek;
            content.workHoli = this.workHoli;
            return content;
        }

        get object() {
            const obj = {};
            obj.text = this.text;
            obj.hpd = this.hpd;
            obj.workWeek = this.workWeek;
            obj.workHoli = this.workHoli;
            return obj;
        }
    }

    class Row {
        constructor() {
            this.text = null;

            this.isHour = false;
            this.from = null;
            this.to = null;
        }

        load(obj) {
            this.text = obj.text;
        }

        equals(other) {
            return this.text == other.text;
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
    const $daysM = $(".days .month");
    const $daysD = $(".days .day");
    const $keys = $(".keys");
    const $datas = $(".datas");
    const $hpd = $(".hpd");

    const $text = $("textarea");
    const $textdiv = $("div.text");

    const $workWeek = $(".wk-w");
    const $workHoli = $(".wk-h");

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
    $hpd.val(content.hpd);
    $workWeek.prop("checked", content.workWeek);
    $workHoli.prop("checked", content.workHoli);

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

    const isHoli = mnt => {
        return mnt.day() === 0 || mnt.day() === 6 || holidayDic.hasOwnProperty(mnt.format("YYYY-MM-DD"));
    }

    const render = async () => {
        $daysD.empty();
        $daysM.empty();
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

            if (content.workWeek || content.workHoli) {
                const rowNum = row.text.replace(/^.*[\s　]([0-9０-９]+[\.．]?[0-9０-９]*)$/, "$1")
                const num = Number(rowNum.replace("．", ".").replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 65248)));
                if (Number.isNaN(num) == false && num !== 0) {
                    row.isHour = true;

                    let taskDay = num / content.hpd;
                    while (taskDay > 0) {
                        const wk = today.clone().add(addDay, "days");
                        if (content.workWeek === false && isHoli(wk) === false) {
                            addDay++;
                        } else if (content.workHoli === false && isHoli(wk)) {
                            addDay++;
                        } else {
                            const add = Math.min(taskDay, 1);
                            taskDay -= add;
                            addDay += add;
                        }
                    }
                }
            }
            row.to = today.clone().add(addDay, "days");
        }
        let lastDay = today.clone().add(addDay, "days").clone();

        let colDay = today.clone();
        let prevM = null;
        while (colDay.isSameOrBefore(lastDay)) {
            const $month = $("<div>");
            const $day = $("<div>");

            let m = colDay.format("M");
            if (prevM !== m) {
                prevM = m;
                $month.text(m);
                $month.css("border-left", "solid #AAA");
                $day.css("border-left", "solid #AAA");
            }
            $daysM.append($month);
            $day.text(colDay.format("DD"));
            $daysD.append($day);
            let color = null;
            if (isHoli(colDay))
                color = "#A6A";
            else if (colDay.day() % 2 == 0)
                color = "#442";
            else
                color = "#244";

            $month.css("background-color", color);
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

            prevM = null;
            let tdDay = today.clone();
            while (tdDay.isSameOrBefore(lastDay)) {
                const $data = $("<div>");
                $rowdiv.append($data);
                if (tdDay.isSameOrAfter(row.from) && tdDay.isSameOrBefore(row.to))
                    if (row.isHour)
                        $data.html("●");

                let m = tdDay.format("M");
                if (prevM !== m) {
                    prevM = m;
                    $data.css("border-left", "solid #AAA");
                }
                let color = null;
                if (isHoli(tdDay))
                    color = chroma("#ede");
                else if (tdDay.day() % 2 == 0)
                    color = chroma("#eed");
                else
                    color = chroma("#dee");

                if (i % 2 == 0)
                    color = color.mix('#88F', 0.125);

                $data.css("background-color", color.css());
                tdDay.add(1, "days");
            }
        }
    }

    const check = async index => {
        const lines = $text.val().split('\n');
        lines.splice(index, 1);
        $text.val(lines.join('\n'));
    }

    const push = async () => {
        console.log(content.object);
        await docRef.set({ "content": content.object, "date": Date.now() });
    }

    let now = Date.now();
    let prevSave = null;
    let prevRender = null;
    while (true) {
        content.text = $text.val();
        content.hpd = Number($hpd.val());
        if (content.hpd < 1) {
            $hpd.val(1);
            content.hpd = 1;
        }
        content.workWeek = $workWeek.prop("checked");
        content.workHoli = $workHoli.prop("checked");

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