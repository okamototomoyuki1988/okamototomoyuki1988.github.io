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
            let strs = [];
            const readFileAsync = (f)=>{
                return new Promise((resolve)=>{
                    let reader = new FileReader();
                    reader.readAsText(f);
                    reader.onload = (content)=>{
                        strs = [...strs, content.target.result];
                        resolve();
                    }
                }
                );
            }

            Promise.all(files.map((f)=>readFileAsync(f))).then(()=>{
                if (strs.length > 1) {
                    // 複数ならリストにまとめる
                    $("#read-json").value = JSON.stringify(strs.map((str)=>JSON.parse(str)), null, 2);
                } else {
                    // 一つならそのまま
                    $("#read-json").value = JSON.stringify(JSON.parse(strs[0]), null, 2);
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

                let obj = null;
                try {
                    obj = JSON.parse($("#read-json").value);
                } catch (e) {}

                if (obj != null) {
                    let result = null;
                    try {
                        result = JSONPath({
                            json: obj,
                            path: $("#query").value
                        });
                    } catch (e) {}

                    if ($("#distinct").checked) {
                        // 重複削除
                        let distinctList = [];
                        for (let i = 0; i < result.length; i++) {
                            let ele1 = result[i];
                            for (let j = i + 1; j < result.length; j++) {
                                let ele2 = result[j];
                                if (JSON.stringify(ele1) === JSON.stringify(ele2)) {
                                    ele1 = undefined;
                                    break;
                                }
                            }

                            if (ele1 !== undefined) {
                                distinctList.push(ele1);
                            }
                        }
                        result = distinctList;
                    }

                    $("#result").value = JSON.stringify(result, null, 2);
                }
            }

            window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }
}
