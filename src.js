// クエリショートカット
const $ = (query)=>document.querySelector(query);
const $$ = (query)=>document.querySelectorAll(query);

// ファイルリストに拡張メソッド
FileList.prototype.map = function() {
    return Array.prototype.map.call(this, ...arguments);
}

window.onload = ()=>{
    // JSONマージ
    {
        const handleFileSelect = (evt)=>{
            evt.stopPropagation();
            evt.preventDefault();

            // ファイル情報取得
            let files = evt.dataTransfer.files;

            // ファイル非同期読み込み
            let objs = [];
            let errors = [];
            const readFileAsync = (f)=>{
                return new Promise((resolve)=>{
                    let reader = new FileReader();
                    reader.readAsText(f);
                    reader.onload = (content)=>{
                        let result = content.target.result;
                        // JSONか
                        let obj = null;
                        try {
                            obj = JSON.parse(result);
                        } catch (e) {
                            errors.push(f.name);
                        }
                        if (obj != null) {
                            objs = [...objs, obj];
                        }
                        resolve();
                    }
                }
                );
            }

            Promise.all(files.map((f)=>readFileAsync(f))).then(()=>{
                if (objs.length > 1) {
                    // 複数ならリストにまとめる
                    $("#read-json").value = JSON.stringify(objs, null, 2);
                } else {
                    // 一つならそのまま
                    $("#read-json").value = JSON.stringify(objs[0], null, 2);
                }

                // エラー表示
                if (errors.length > 0) {
                    $("#error").innerHTML = "下記はフォーマットが不正なためスキップしました。<br>" + errors.join(",");
                } else {
                    // エラー無し
                    $("#error").innerHTML = "";
                }

            }
            );
        }

        const handleDragOver = (evt)=>{
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
        }

        // Setup the dnd listeners.
        const dropZone = $('#read-json');
        dropZone.addEventListener('dragover', handleDragOver, false);
        dropZone.addEventListener('drop', handleFileSelect, false);
    }

    // JSONPath
    {
        let start = null;
        let step = (timestamp)=>{
            if (!start)
                start = timestamp;
            var delta = timestamp - start;
            if (delta > 1500) {
                start = null;
                // 3秒ごとにクエリ実行

                let resultText = null;
                let obj = null;

                let src = $("#read-json").value;
                if (src != "") {
                    try {
                        obj = JSON.parse($("#read-json").value);
                    } catch (e) {
                        resultText = "JSONが不正です"
                    }
                } else {
                    resultText = "";
                }

                if (obj != null) {
                    let queryResult = null;
                    try {
                        queryResult = JSONPath({
                            json: obj,
                            path: $("#query").value
                        });
                    } catch (e) {}

                    if (queryResult != null && $("#distinct").checked) {
                        // 重複削除
                        let distinctList = [];
                        for (let i = 0; i < queryResult.length; i++) {
                            let ele1 = queryResult[i];
                            for (let j = i + 1; j < queryResult.length; j++) {
                                let ele2 = queryResult[j];
                                if (JSON.stringify(ele1) === JSON.stringify(ele2)) {
                                    ele1 = undefined;
                                    break;
                                }
                            }

                            if (ele1 !== undefined) {
                                distinctList.push(ele1);
                            }
                        }
                        queryResult = distinctList;
                    }

                    resultText = JSON.stringify(queryResult, null, 2);
                }
                // 結果表示
                $("#result").value = resultText;
            }

            window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }
}
