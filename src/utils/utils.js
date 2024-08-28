import fetch from "node-fetch";

export const defProxy = 'https://proxy.adminbase.ru/';

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function shortIntegers(int) {
    try {
        return int.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
    } catch (e) {
        return 0;
    }
}

export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const obj = {};
    for (const key of params.keys()) {
        obj[key] = params.get(key);
    }
    return obj;
}

export function decOfNum(number, titles, needNumber = true) {
    if (typeof titles === 'object') {
        if (number !== undefined) {
            let decCache = [],
                decCases = [2, 0, 1, 1, 1, 2];
            if (!decCache[number]) decCache[number] = number % 100 > 4 && number % 100 < 20 ? 2 : decCases[Math.min(number % 10, 5)];
            return (needNumber ? number + ' ' : '') + titles[decCache[number]];
        }
    } else {
        return `${number} ${titles}`;
    }
}

export function getLocalStorageData(key, defaultValue) {
    let value = localStorage.getItem(key);
    if (value && (value.startsWith('{') || value.startsWith('['))) value = JSON.parse(value);
    if (typeof value === 'string' && (value === '' || value === 'null')) value = null;
    return value || defaultValue;
}

export function setLocalStorageData(key, value = '') {
    if (typeof value === 'object') value = JSON.stringify(value);
    return localStorage.setItem(key, value);
}

function convJsonToUrlParams(obj) {
    return '?' + Object.keys(obj).map((value) =>
        encodeURIComponent(value) + '=' + encodeURIComponent(obj[value])
    ).join('&');
}

export async function vkApi(method, params = {}, proxy) {
    if (!params.v) params.v = '5.130';

    return await api('vk.api', {
        method, params: JSON.stringify(params), proxy
    });
    //return await fetch(`${defProxy}https://api.vk.com/method/${method}${convJsonToUrlParams(params)}`).then(r => r.json());
}

export async function vkApiPost(url, body, proxy) {
    return await fetch(defProxy + url, {method: 'POST', body}).then(res_ => {
        return res_.json();
    });
}

export const apiUrl = 'https://api.adminbase.ru';

export async function api(method, params = {}, extended = false) {
    if (!params.access_token) {
        if (this && this.access_token) {
            params.access_token = this.access_token;
        }
    }
    const data = params._method === 'POST' ? await apiPost(`method/${method}`, {}, JSON.stringify(params)) : await fetch(`${apiUrl}/method/${method}${convJsonToUrlParams(params)}`).then(r => r.json());

    if (extended) {
        if (data.response) {
            return data.response;
        } else {
            if (this) {
                throw new Error(data.error.message);
            } else {
                return data;
            }
        }
    } else {
        return data;
    }
}

export async function apiPost(method, params = {}, body) {
    if (!params.access_token) {
        if (this && this.access_token) {
            params.access_token = this.access_token;
        }
    }
    return await fetch(`${apiUrl}/${method}${convJsonToUrlParams(params)}`, {
        method: 'POST',
        body,
        ...(body && typeof body === 'string' && body.startsWith('{')) ? {headers: {"Content-Type": "application/json"}} : {}
    }).then(res_ => {
        return res_.json();
    });
}

export function checkErrorAuthToken(obj) {
    return obj.error && obj.error.error_code === 5;
}

export function multiIncludes(key, values) {
    for (const value of values) {
        if (key.includes(value)) {
            return true;
        }
    }
    return false;
}

export function skipMsgErrorCodes(obj) {
    const codes = [100, 104, 900, 901, 902, 917, 921, 922, 925, 936, 945, 946, 950, 962, 969, 983, 985, 1012];
    return obj.error && codes.indexOf(obj.error_code) > -1;
}

export async function getBlob(url) {
    return await fetch(url).then(r => r.blob());
}

export function getFile(file) {
    return `${apiUrl}/files/${file}`;
}

export function clearStringFromUrl(text) {
    return text
        .replace(/https:\/\//g, '')
        .replace(/http:\/\//g, '')
        .replace(/m.vk.com\//g, '')
        .replace(/vk.com\//g, '')
        .replace(/app/g, '')
        .replace(/group/g, '')
        .replace(/public/g, '')
        .replace(/club/g, '')
        .replace(/@/g, '')
        .replace(/id/g, '')
        ;
}

export async function onFileChange(e, accept) {
    const {files} = e.target || window.event.srcElement;
    let ret_files = [];

    if (FileReader && files && files.length) {
        for (const file of files) {
            const reader = new FileReader();
            await new Promise(res => {
                reader.onload = () => {
                    file.src = reader.result;
                    ret_files.push(file);
                    res();
                };
                reader.readAsDataURL(file);
            });
        }
    }

    if (accept) {
        ret_files = ret_files.filter(value =>
            typeof accept === 'object' ?
                accept.indexOf(value.type.split('/')[0]) > -1 :
                value.type.split('/')[0] === accept
        );
    }

    return ret_files;
}

export function openUrl(url, download) {
    const element = document.createElement('a');
    element.href = url;
    if (download) {
        element.download = download;
    }
    element.target = '_blank';
    element.click();
    element.remove();
}

export function reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
}

export function openLinkFromText(text) {
    if (text.includes('vk.com')) {
        const str = text.substring(text.indexOf('vk.com/'));
        let url = str.substring(0, str.indexOf(':'));
        if (url.includes(' ')) {
            url = str.substring(0, str.indexOf('.'));
        }
        openUrl('https://' + url);
    } else if (text.includes('@club')) {
        const str = text.substring(text.indexOf('@club'));
        let url = str.substring('@club'.length, str.indexOf(':'));
        if (url.includes(' ')) {
            url = str.substring('@club'.length, str.indexOf('.'));
        }
        openUrl('https://vk.com/club' + url);
    }
}

export async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
}

export function isMobile() {
    return document.getElementById('main').className.includes('mobile');
}

export function getTokenFromStr(str) {
    try {
        return str.split('#')[1].split('&').find(v => v.includes('access_token')).split('=')[1]
    } catch (e) {
        return str;
    }
}

export async function getFullDocPath(url) {
    const doc_fetch = await fetch(url).then(r => r.text());
    if (doc_fetch.includes('docs_no_preview_download_btn_container')) {
        url = doc_fetch.split('docs_no_preview_download_btn_container')[1].split('span')[0].split('href="')[1].split('"')[0];
    }
    return url;
}