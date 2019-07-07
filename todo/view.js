window.onload = async () => {

    const url = new URL(location.href);
    const params = url.searchParams;
    // const pId = params.get("id");
    // TODO 
    const pId = "1";
    const pHpd = params.get("hpd");

    if (pId === null)
        throw new Error("パラメータを入力してください。");

    const hpd = pHpd != null ? Number(pHpd) : 6;

    const db = firebase.firestore();
    const docRef = db.collection(FS_COL).doc(pId);

    class Content {
        constructor(list) {
            this.rows = [];
            for (const ele of list)
                this.rows.push(Row.new(ele));
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
            const list = [];
            for (const row of this.rows) {
                list.push(row.object);
            }
            return list;
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
        static new = (obj) => {
            const row = new Row();
            row.isComplete = obj.isComplete;
            row.text = obj.text;
            row.hour = obj.hour;
            row.isNest = obj.isNest;
            return row;
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

    let content = null;

    const res = await fetch('https://holidays-jp.github.io/api/v1/date.json');
    const holidayDic = await res.json();

    const _read = async () => {
        //     while (true) {
        let doc = await docRef.get();
        if (doc.exists) {
            content = new Content(doc.data().content);
            // let newContent = new Content(doc.data().content);
            // if (content == null || !content.equals(newContent)) {
            // content = newContent;
            render();
            // }
        }
        // await sleep(SPAN);
        //     }
    }
    _read();

    const _key = (e, query) => {
        if (query.includes("#") && e.shiftKey == false) {
            return false;
        }
        if (query.includes("%") && e.ctrlKey == false) {
            return false;
        }
        if (query.includes("&") && e.altKey == false) {
            return false;
        }
        if (query.includes(e.key)) {
            return true;
        }
    }
    $('html').keydown(async e => {
        if (_key(e, "o")) {
            content.rows.push(new Row());
            await push();

            render();
            return false;
        }
        return true;
    });

    const render = async () => {
        const $days = $(".days");
        const $keys = $(".keys");
        const $datas = $(".datas");
        $days.empty();
        $keys.empty();
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

        for (const i in content.rows) {
            const row = content.rows[i];
            if (row.isComplete)
                continue;
            // $tr.css("display", "none");
            const $ck = $(`<input type='checkbox'/>`);
            $ck.click(() => check(i));
            const $ckdiv = $(`<div>`);
            $ckdiv.append($ck);
            $keys.append($ckdiv);

            const $name = $(`<input type='text'/>`);
            $name.val(row.text);
            $name.on('input', () => { row.text = $name.val(); push(); });
            const $namediv = $(`<div>`);
            $namediv.append($name);
            $keys.append($namediv);

            const $h = $(`<input type='text'/>`);
            $h.val(row.hour);
            $h.on('input', () => { row.hour = $h.val(); push(); });
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
        content.rows[index].isComplete = true;
        await push();
    }

    const push = async () => {
        await docRef.set({ "content": content.object, "date": Date.now() });
    }
}