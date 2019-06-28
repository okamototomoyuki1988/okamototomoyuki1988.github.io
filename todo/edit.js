
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
        const $ = (query) => document.querySelector(".todo").querySelector(query);
        const _COL = "todos";

        const url = new URL(location.href);
        const params = url.searchParams;
        const pId = params.get("name");
        const pPrj = params.get("prj");

        const $text = $(".text");

        if (pId === null || pPrj === null) {
            $text.value = "パラメータを入力してください。";
            return;
        }

        const db = firebase.firestore();
        const docRef = db.collection(_COL).doc(pId);

        let text = null;
        try {
            let doc = await docRef.get();
            if (doc.exists) {
                text = doc.data().text;
                $text.value = text;
            }
        } catch (e) {
            $text.value = "Error getting document:" + e;
            return;
        }

        let prev = null;
        const _update = async (timestamp) => {
            if (prev == null) {
                prev = timestamp;
                return;
            }
            let delta = timestamp - prev;
            if (delta > 1500) {
                prev = timestamp;
                if (text !== $text.value) {
                    text = $text.value;
                    try {
                        await docRef.set({"text" : text});
                    } catch (e) {
                        $text.value = "Error post document:" + e;
                    }
                }
            }
        }
        _updates.push(_update);
    }
}
