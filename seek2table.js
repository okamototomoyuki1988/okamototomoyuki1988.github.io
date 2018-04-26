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
    ;
    const _routine = async()=>{
        // the game loop
        while (true) {
            var delta = await _animationFrame();
            for (let _update of _updates) {
                _update(delta);
            }
        }
    }
    ;
    _routine();

    // seek2table
    {
        // クエリショートカット
        const $ = (query)=>document.querySelector("#seek2table").querySelector(query);
        let $regex = $(".regex");
        let $src = $(".src");
        let $result = $(".result");
        let $distinct = $(".distinct");
        let $col = $(".col");

        const _KEY_SAVE_REGEX = "seek2table_regex";
        const _KEY_SAVE_SRC = "seek2table_src";
        const _KEY_SAVE_DISTINCT = "seek2table_distinct";
        const _KEY_SAVE_COL = "seek2table_col";

        let saveRegex = localStorage.getItem(_KEY_SAVE_REGEX);
        let saveSrc = localStorage.getItem(_KEY_SAVE_SRC);
        let saveDistinct = localStorage.getItem(_KEY_SAVE_DISTINCT);
        let saveCol = localStorage.getItem(_KEY_SAVE_COL);

        $regex.value = saveRegex;
        $src.value = saveSrc;
        $distinct.checked = saveDistinct === "true";
        $col.checked = saveCol === "true";

        // ファイル読み込み

        // 更新
        let prevRegex = null;
        let prevSrc = null;
        let prevDistinct = null;
        let prevCol = null;
        let step = (timestamp)=>{
            let regex = $regex.value;
            let src = $src.value;
            let distinct = $distinct.checked;
            let col = $col.checked;
            if (prevRegex !== regex || prevSrc !== src || prevDistinct !== distinct || prevCol !== col) {
                prevRegex = regex;
                prevSrc = src;
                prevDistinct = distinct;
                prevCol = col;
                // 変わったら更新

                // キーの保持
                localStorage.setItem(_KEY_SAVE_REGEX, regex);
                localStorage.setItem(_KEY_SAVE_SRC, src);
                localStorage.setItem(_KEY_SAVE_DISTINCT, distinct);
                localStorage.setItem(_KEY_SAVE_COL, col);

                // 空白で区切る
                src = src.replace(/　/, " ");
                let eles = src.split(/\s+/);
                let keyReg = null;
                try {
                    keyReg = new RegExp(regex);

                } catch (e) {}

                if (keyReg != null) {

                    $result.value = "";
                    // キー一覧を作る
                    let columns = [];
                    for (ele of eles) {
                        let keys = keyReg.exec(ele);
                        if (keys != null && keys.length > 0) {
                            let key = keys[1];
                            if (columns.includes(key) == false) {
                                columns.push(key);
                            }
                        }
                    }

                    let line = new Object();
                    let lineList = [];
                    for (ele of eles) {
                        let prevLine = Object.assign(new Object(), line);

                        let keys = keyReg.exec(ele);
                        if (keys != null && keys.length > 0) {
                            let key = keys[1];
                            let value = ele.replace(new RegExp("^" + key), "");

                            // キーの位置を調べる
                            let index = columns.indexOf(key);

                            if (prevLine[key] != undefined && prevLine[key] !== value) {
                                lineList.push(prevLine);

                                // 消す
                                for (let j = index; j < columns.length; j++) {
                                    let delKey = columns[j];
                                    line[delKey] = undefined;
                                }
                            }
                            line[key] = value;
                        }
                    }
                    lineList.push(line);

                    // キーを書き込む
                    if ($col.checked) {
                        for (let i = 0; i < columns.length; i++) {
                            let column = columns[i];
                            $result.value += column;
                            $result.value += "\t";
                        }
                        $result.value += "\n";
                    }

                    // 書き込み
                    let prevObject = {};
                    for (line of lineList) {
                        let isExist = false;
                        for (let i = 0; i < columns.length; i++) {
                            let column = columns[i];

                            if (line[column] !== undefined) {
                                if (prevObject[column] !== line[column]) {
                                    // 後ろは全部前回と不一致
                                    for (let j = i + 1; j < columns.length; j++) {
                                        let afterColumn = columns[j];
                                        prevObject[afterColumn] = undefined;
                                    }
                                }
                            }

                            let str = null;
                            if ($distinct.checked && line[column] != undefined && line[column] === prevObject[column]) {
                                str = "↓";
                            } else {
                                str = line[column];
                            }

                            $result.value += str != undefined ? str : "";
                            prevObject[column] = line[column];
                            $result.value += "\t";
                        }
                        $result.value += "\n";
                    }
                }
            }
        }
        ;

        _updates.push(step);
    }
}

// オブジェクトの値が一緒またはsrcになければtrue
function isSaveOrAdd(src, dest) {
    for (let key in dest) {
        if (src[key] != undefined) {
            if (src[key] != dest[key]) {
                return false;
            }
        }
    }
    return true;
}
