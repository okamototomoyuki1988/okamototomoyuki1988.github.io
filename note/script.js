const FS_COL = "notes";
const SPAN = 500;

class Content {
    constructor() {
        this.notes = [];
    }

    load(obj) {
        for (const src of obj.notes) {
            const note = new Note();
            note.load(src);
            this.notes.push(note);
        }
    }

    clone() {
        const clone = new Content();
        for (const note of this.notes) {
            clone.notes.push(note.clone);
        }
        return clone;
    }

    get object() {
        const obj = {};
        obj.notes = [];
        for (const ele of this.notes) {
            obj.notes.push(ele.object);
        }
        return obj;
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

    const db = firebase.firestore();
    const docRef = db.collection(FS_COL).doc(pId);


    const $text = $("textarea");

    const content = new Content()
    const _read = async () => {
        let doc = await docRef.get();
        if (doc.exists)
            content.load(doc.data().content);
        else {
            content.notes.push(new Note());
            content.notes[0].text = "";
        }
    }
    await _read();
    $text.val(content.notes[0].text);

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

    const push = async () => {
        console.log(content.object);
        await docRef.set({ "content": content.object, "date": Date.now() });
    }

    let now = Date.now();
    let prevSave = null;
    while (true) {
        content.notes[0].text = $text.val();

        if (Date.now() - now > 1500) {
            if (prevSave == null || deepEquals(content, prevSave) == false) {
                prevSave = content.clone();
                now = Date.now();
                push();
            }
        }
        await waitNext();
    }
}