window.onload = async () => {

    const url = new URL(location.href);
    const params = url.searchParams;
    const pId = params.get("id");

    const $text = $(".text");

    if (pId === null) {
        $text.value = "パラメータを入力してください。";
        return;
    }

    const db = firebase.firestore();
    const docRef = db.collection(FS_COL).doc(pId);

    let isRead = false;
    let text = null;

    const _read = async () => {
        while (true) {
            let doc = await docRef.get();
            if (doc.exists) {
                let newText = doc.data().text;
                if (text !== newText) {
                    isRead = true;
                    text = newText;
                    $text.val(text);
                }
            }
            await sleep(SPAN);
        }
    }
    _read();

    const _update = async () => {
        await waitWhile(() => isRead);
        while (true) {
            if (text !== $text.val()) {
                text = $text.val();
                await docRef.set({ "text": text, "date": Date.now() });
            }
            await sleep(SPAN);
        }
    }
    _update();
}
