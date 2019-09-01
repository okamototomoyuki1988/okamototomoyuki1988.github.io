const FS_COL = "notes";
const SPAN = 500;

class Content {
    constructor() {
        this.notes = [];
        this.date = 0;
    }

    load(json) {
        this.notes.length = 0;
        for (const src of json.notes) {
            const note = new Note();
            note.load(src);
            this.notes.push(note);
        }
        this.date = json.date;
    }

    clone() {
        const clone = new Content();
        for (const note of this.notes) {
            clone.notes.push(note.clone());
        }
        clone.date = this.date;
        return clone;
    }

    get object() {
        return removeFuncDeep(Object.assign({}, this));
    }
}

class Note {
    constructor() {
        this.text = null;
    }

    load(obj) {
        Object.assign(this, obj);
    }

    clone() {
        return Object.assign(new Note(), this);
    }

    get object() {
        return removeFuncDeep(Object.assign({}, this));
    }
}

window.onload = async () => {

    const url = new URL(location.href);
    const params = url.searchParams;
    const pId = params.get("id");

    if (pId === null)
        throw new Error("パラメータを入力してください。");
    const $text = $(".text");

    const db = firebase.firestore();
    const docRef = db.collection(FS_COL).doc(pId);

    let content = new Content();
    content.notes.push(new Note());
    content.notes[0].text = "";

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

    const _read = doc => {
        if (doc.exists) {
            if (doc.data().date > content.date) {
                console.log("rec:" + JSON.stringify(doc.data()));
                content.load(doc.data());
                $text.html(content.notes[0].text);
            }
        }
    }
    docRef.onSnapshot(doc => {
        _read(doc);
    });

    let doc = await docRef.get();
    _read(doc);

    const push = async () => {
        const obj = removeFuncDeep(Object.assign({}, content));
        console.log("send:" + JSON.stringify(obj));
        await docRef.set(obj);
    }

    let syncTime = Date.now();
    while (true) {
        const text = $text.html();
        if (content.notes[0].text !== text) {
            content.isDirty = true;
            content.date = Date.now();
            content.notes[0].text = text;
        }

        if (content.isDirty && (Date.now() - syncTime) > 1500) {
            if (content.isDirty) {
                syncTime = Date.now();
                content.isDirty = false;
                await push();
            }
        }
        await waitNext();
    }
}