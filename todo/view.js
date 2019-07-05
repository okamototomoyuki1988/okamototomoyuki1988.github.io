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
        rows = [];

        constructor(list) {
            for (const ele in list)
                rows.push(Row.new(ele));
        }

        equals(other) {
            if (this.rows.length != other.rows.length)
                return false;

            for (const i in this.rows)
                if (!this.rows[i].equals(other.rows[i]))
                    return false;
            return true;
        }
    }

    class Row {
        isComplete;
        hour;
        isNest;

        from;
        to;

        static new = (obj) => {
            const row = new Row();
            obj && Object.assign(this, obj);
            return row;
        }

        equals = (other) =>
            this.isComplete == other.isComplete
            && this.hour == other.hour
            && this.isNest == other.isNest;
    }

    let content = null;

    const res = await fetch('https://holidays-jp.github.io/api/v1/date.json');
    const holidayDic = await res.json();

    const _read = async () => {
        while (true) {
            let doc = await docRef.get();
            if (doc.exists) {
                let newContent = new Content(doc.data().content);
                if (content == null || !content.equals(newContent)) {
                    content = newContent;
                    render();
                }
            }
            await sleep(SPAN);
        }
    }
    _read();

    $('html').keydown(e => {
        switch (e.which) {
            case 39:
                break;
            case 37:
                break;
            case 38:
                break;
            case 40:
                break;
        }
    });

    const render = async () => {
        const $thead = $("thead");
        const $tbody = $("tbody");

        $thead.find("th:not(.blank)").remove();
        $tbody.empty();

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

        for (const i of content.rows) {
            const row = content.rows[i];
            const $tr = $("<tr>");
            $tbody.append($tr);
            if (row.isComplete)
                $tr.css("display", "none");
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

    const check = async (index) => {
        content.rows[index].isComplete = true;
        await docRef.set({ "content": content, "date": Date.now() });
    }
}