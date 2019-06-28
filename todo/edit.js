window.onload = () => {

    let _updates = [];

    const _animationFrame = () => {
        return new Promise(resolve => window.requestAnimationFrame((delta) => resolve(delta)));
    }
    const _routine = async () => {
        while (true) {
            var delta = await _animationFrame();
            for (let _update of _updates) {
                _update(delta);
            }
        }
    }
    _routine();

    {
        const $ = (query) => document.querySelector(".todo").querySelector(query);

        const _GIST_URL = "https://api.github.com/gists";
        const _KEY_SAVE_ID = "SAVE/ID";
        const _KEY_SAVE_PSWD = "SAVE/PSWD";
        const _KEY_SAVE_NAME = "SAVE/NAME";

        const $id = $(".id");
        const $pswd = $(".pswd");
        const $name = $(".name");
        const $text = $(".text");

        const _assignIfNotEmpty = ($input, key) => {
            let saveValue = localStorage.getItem(key);
            if (saveValue !== null) {
                $input.value = saveValue;
            }
        };
        _assignIfNotEmpty($id, _KEY_SAVE_ID);
        _assignIfNotEmpty($pswd, _KEY_SAVE_PSWD);
        _assignIfNotEmpty($name, _KEY_SAVE_NAME);
        const _changeToSave = ($input, key) => (_) => {
            let inputValue = $input.value;
            let saveValue = localStorage.getItem(key);
            if (inputValue !== saveValue) {
                localStorage.setItem(key, inputValue);
            }
        };
        _updates.push(_changeToSave($id, _KEY_SAVE_ID));
        _updates.push(_changeToSave($pswd, _KEY_SAVE_PSWD));
        _updates.push(_changeToSave($name, _KEY_SAVE_NAME));

    }
}
