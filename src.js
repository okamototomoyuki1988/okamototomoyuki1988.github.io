const $ = (query)=>document.querySelector(query);
const $$ = (query)=>document.querySelectorAll(query);

// ファイルリストに拡張メソッド
FileList.prototype.map = function() {
    return Array.prototype.map.call(this, ...arguments);
}

window.onload = ()=>{

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
            $("#list").value = JSON.stringify(strs.map((str) => JSON.parse(str)));
        }
        );
    }

    const handleDragOver = (evt)=>{
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }

    // Setup the dnd listeners.
    let dropZone = $('#drop_zone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);

}
