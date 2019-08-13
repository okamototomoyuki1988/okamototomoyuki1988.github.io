
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
const waitNext = () => new Promise(resolve => window.requestAnimationFrame(resolve));
const waitWhile = pred => new Promise(resolve => {
    const _checkFlag = () => {
        if (pred())
            resolve();
        else
            window.requestAnimationFrame(_checkFlag);
    };
    _checkFlag();
});
const removeFuncDeep = arg => {
    if (typeof arg == "object")
        for (let key in arg)
            if (arg[key] == "function")
                delete arg[key];
    return arg;
}
const deepEquals = (variable1, variable2) => {
    if (typeof variable2 === "undefined") {
        return false;
    }
    if (typeof variable1 === "object") {
        for (const key in variable1) {
            if (!deepEquals(variable1[key], variable2[key])) {
                return false;
            }
        }
    } else {
        if (variable1 !== variable2) {
            return false;
        }
    }
    return true;
}