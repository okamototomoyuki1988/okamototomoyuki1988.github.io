// ファイルリストに拡張メソッド
FileList.prototype.map = function() {
    return Array.prototype.map.call(this, ...arguments);
}

window.onload = ()=>{

    // 毎フレーム更新
    let _updates = [];

    // 更新
    const _animationFrame = ()=>{
        return new Promise(resolve=>window.requestAnimationFrame((delta)=>resolve(delta)));
    }
    const _routine = async()=>{
        // the game loop
        while (true) {
            var delta = await _animationFrame();
            for (let _update of _updates) {
                _update(delta);
            }
        }
    }
    _routine();

    // JSONPath
    {
        // クエリショートカット
        const $ = (query)=>document.querySelector("#jpath").querySelector(query);

        // ファイル読み込み
        {
            // 読み込み処理定義
            const handleFileSelect = async(evt)=>{
                evt.stopPropagation();
                evt.preventDefault();

                // ファイル情報取得
                let files = evt.dataTransfer.files;
                const readFileAsync = (f)=>{
                    return new Promise((resolve)=>{
                        let reader = new FileReader();
                        reader.readAsText(f);
                        reader.onload = (content)=>{
                            let result = content.target.result;
                            // JSONか
                            try {
                                resolve(JSON.parse(result));
                            } catch (e) {
                                resolve(null);
                            }
                        }
                    }
                    );
                }

                // 読み込み実行
                let objs = [];
                let errors = [];
                for (let f of files) {
                    let obj = await readFileAsync(f);
                    if (obj != null) {
                        objs = [...objs, obj];
                    } else {
                        errors = [...errors, f.name];
                    }
                }

                if (objs.length > 1) {
                    // 複数ならリストにまとめる
                    $(".src").value = JSON.stringify(objs, null, 2);
                } else {
                    // 一つならそのまま
                    $(".src").value = JSON.stringify(objs[0], null, 2);
                }

                // エラー表示
                if (errors.length > 0) {
                    $(".error").innerHTML = "下記はフォーマットが不正なためスキップしました。<br>" + errors.join(",");
                } else {
                    // エラー無し
                    $(".error").innerHTML = "";
                }

            }

            const handleDragOver = (evt)=>{
                evt.stopPropagation();
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'copy';
            }

            // Setup the dnd listeners.
            const dropZone = $(".src");
            dropZone.addEventListener('dragover', handleDragOver, false);
            dropZone.addEventListener('drop', handleFileSelect, false);
        }

        // JSONPath
        {
            // 更新
            let start = null;
            let step = (timestamp)=>{
                if (!start)
                    start = timestamp;
                let delta = timestamp - start;
                if (delta > 1500) {
                    start = null;
                    // 3秒ごとにクエリ実行

                    let resultText = null;
                    let obj = null;

                    let src = $(".src").value;
                    if (src != "") {
                        try {
                            obj = JSON.parse($(".src").value);
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
                                path: $(".query").value
                            });
                        } catch (e) {}

                        if (queryResult != null && $(".distinct").checked) {
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
                            // ソート
                            distinctList.sort();

                            queryResult = distinctList;
                        }

                        resultText = JSON.stringify(queryResult, null, 2);
                    }
                    // 結果表示
                    $(".result").value = resultText;
                }
            }
            _updates.push(step);
        }
    }

    // Distinct
    {
        // クエリショートカット
        const $ = (query)=>document.querySelector("#distinct").querySelector(query);

        // 更新
        let start = null;
        let step = (timestamp)=>{
            if (!start)
                start = timestamp;
            let delta = timestamp - start;
            if (delta > 1500) {
                start = null;
                // 3秒ごとに実行

                let resultText = null;

                let orgText = $(".org").value;
                let orgLines = orgText.split(/\r\n|\r|\n/);

                let result = $(".result");
                result.value = "";

                // 数値の変換して取り込み
                let nums = [];
                for (let org of orgLines) {
                    if (org != "") {
                        let num = Number(org);
                        if (isNaN(num)) {
                            result.value = "数値に変換できない行がありました。";
                            nums = null;
                            break;
                        } else {
                            // 未追加なら追加
                            if (nums.indexOf(num) < 0) {
                                nums.push(num);
                            }
                        }
                    }
                }

                // エラーでなければ表示
                if (nums != null) {
                    // ソート
                    nums.sort(function(a, b) {
                        return (parseInt(a) > parseInt(b)) ? 1 : -1;
                    });
                    // 書き込み
                    for (let num of nums) {
                        result.value += num + "\n";
                    }
                }
            }
        }
        _updates.push(step);

    }
}
