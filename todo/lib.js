const FS_COL = "todos";
const SPAN = 500;

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
const waitWhile = pred => new Promise(resolve => {
    const _checkFlag = () => {
        if (pred())
            resolve();
        else
            window.requestAnimationFrame(_checkFlag);
    };
    _checkFlag();
});