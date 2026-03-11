const htmlEl = document.documentElement;

const Caches = {};
const get = async (url) => {
    if (Caches[url]) return Caches[url];
    htmlEl.setAttribute('data-no-touch', true);
    const f = await fetch(url);
    const data = await f.json();
    Caches[url] = data;
    htmlEl.setAttribute('data-no-touch', false);
    return data;
}

const Images = {};

const loadImage = (src, name, artist, onOver) => {
    if (Images[src]) return onOver(Images[src]);
    const el = new Image();
    if (src !== "score.png")
        el.crossOrigin = 'anonymous';
    el.src = src;
    el.onload = () => {
        onOver(el)
        Images[src] = el;
    }
};

const typeTextsOld = `入坑作
最喜欢
听最多次
最想安利
最长情

最佳歌词
最佳 pv
最佳作曲
最佳调声
最佳 live 演出

最治愈
最感动
最虐心
最震撼
最被低估

最滑稽
消磨时间就听
工作时听
感觉回到过去
今天最喜欢`;

const typeTextsNew = `入坑作
最喜欢的
循环最多
最推荐
听的第一首

喜欢但大众不爱
讨厌但大众喜欢
最被低估
被高估
最爱听的p主

最佳PV
最佳调教
调的最烂
最佳伴奏
最治愈

最冷门
最燃
最佳歌词
最有趣
最搞怪

最感动
最洗脑
最擦边
最喜欢的专辑
期待哪个p的新歌

近期喜欢的歌
最喜欢的歌姬
收藏最多的歌姬
外表最萌的歌姬
喜欢此歌姬的声音`;

let isNewTable = true;
let types = [];
let vocaloSongsLocalKey = '';
let songs = [];

let col = 5;
let row = 6;
let contentWidth = 610;
let contentHeight = 900;
let width = 0;
let height = 0;

const colWidth = 122;
const rowHeight = 150;
const titleHeight = 40;
const fontHeight = 24;
const bodyMargin = 20;
const scale = 3;

const generatorDefaultSongs = () => {
    songs = new Array(types.length).fill(0);
}

const getSongsFromLocalStorage = () => {
    if (!window.localStorage) return generatorDefaultSongs();
    const songsLocal = JSON.parse(localStorage.getItem(vocaloSongsLocalKey));
    if (!songsLocal || songsLocal.length !== types.length) return generatorDefaultSongs();
    songs = songsLocal;
}

const saveSongsToLocalStorage = () => {
    localStorage.setItem(vocaloSongsLocalKey, JSON.stringify(songs));
};

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const APIURL = `https://vocadb.net/api/`;

let currentSongIdx = null;
const searchBoxEl = document.querySelector('.search-songs-box');
const formEl = document.querySelector('form');
const searchInputEl = formEl[0];
const songListEl = document.querySelector('.song-list');

const openSearchBox = (index) => {
    currentSongIdx = index;
    htmlEl.setAttribute('data-no-scroll', true);
    searchBoxEl.setAttribute('data-show', true);

    searchInputEl.focus();

    const value = songs[currentSongIdx].id;

    if (!/^\d+$/.test(value) && value) {
        searchInputEl.value = value;
    }
}

const closeSearchBox = () => {
    htmlEl.setAttribute('data-no-scroll', false);
    searchBoxEl.setAttribute('data-show', false);
    searchInputEl.value = '';
    formEl.onsubmit();
};

const clearCurrentSong = () => {
    songs[currentSongIdx] = 0;
    drawSongs();
    saveSongsToLocalStorage();
}

const revertSong = () => {
    clearCurrentSong();
    closeSearchBox();
}

const setInputText = () => {
    const text = searchInputEl.value.trim().replace(/,/g, '');
    setCurrentSong(text);
}

const setCurrentSong = (value, url, name, artist) => {
    songs[currentSongIdx] = { id: value, imgsrc: url, name: name, artist: artist };
    drawSongs();
    saveSongsToLocalStorage();
    closeSearchBox();
}

songListEl.onclick = e => {
    const id = +e.target.getAttribute('data-id');
    const url = e.target.getAttribute('img-src');
    const name = e.target.getAttribute('name');
    const artist = e.target.getAttribute('artist');
    if (currentSongIdx === null) return;
    setCurrentSong(id, url, name, artist);
};

const searchFromVocaDBbyKeyword = async keyword => {
    let url = `${APIURL}songs`;
    if (keyword) url = url + `?start=0&getTotalCount=false&maxResults=12&query=${encodeURIComponent(keyword)}&fields=AdditionalNames%2CMainPicture&lang=Default&nameMatchMode=Auto&sort=RatingScore`;

    const songs = await get(url);
    resetSongList(songs);
}

const searchFromVocaDB = () => {
    const keyword = searchInputEl.value.trim();
    if (!keyword) return searchInputEl.focus();

    searchFromVocaDBbyKeyword(keyword);
}

const searchFromAPI = async keyword => {
    let url = `${APIURL}songs`;
    if (keyword) url = url + `?start=0&getTotalCount=false&maxResults=12&query=${encodeURIComponent(keyword)}&fields=AdditionalNames%2CMainPicture&lang=Default&nameMatchMode=Auto&sort=RatingScore`;
    else url = url + '?start=0&getTotalCount=false&maxResults=12&fields=AdditionalNames%2CMainPicture&lang=Default&nameMatchMode=Auto&sort=RatingScore'
    const songs = await get(url);
    resetSongList(songs.items);
}

const resetSongList = songs => {
    songListEl.innerHTML = songs.map(song => {
        if (song.mainPicture)
            return `<div class="song-item" data-id="${song.id}" img-src="${song.mainPicture.urlOriginal}" name="${song.defaultName}" artist="${song.artistString}"><img src="https://api.codetabs.com/v1/proxy?quest=${song.mainPicture.urlThumb}" crossOrigin="anonymous"><h3>${song.defaultName}</h3><h5>${song.artistString}</h5></div>`
        else
            return `<div class="song-item" data-id="${song.id}" name="${song.defaultName}" artist="${song.artistString}"><img src="score.png"><h3>${song.defaultName}</h3><h5>${song.artistString}</h5></div>`;
    }).join('');
}

formEl.onsubmit = async e => {
    if (e) e.preventDefault();
    const keyword = searchInputEl.value.trim();
    searchFromAPI(keyword);
}

const imageWidth = colWidth - 2;
const imageHeight = imageWidth * 3 / 4;
const canvasRatio = imageWidth / imageHeight;

function getLines(ctx, text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

const drawSongs = () => {
    for (let index in songs) {
        const id = songs[index].id;
        const name = songs[index].name;
        const artist = songs[index].artist;
        var url = "score.png";
        if (songs[index].imgsrc)
            url = `https://api.codetabs.com/v1/proxy?quest=${songs[index].imgsrc}`;

        const x = index % col;
        const y = Math.floor(index / col);
        if (!id) {
            ctx.save();
            ctx.fillStyle = '#FFF';
            ctx.fillRect(
                    x * colWidth + 1,
                    y * rowHeight + 1,
                    imageWidth,
                    rowHeight - fontHeight - 2,
            )
            ctx.restore();
            continue;
        }

        ctx.save();
        ctx.fillStyle = '#FFF';
        ctx.fillRect(
                x * colWidth + 1,
                y * rowHeight + 1,
                imageWidth,
                rowHeight - fontHeight - 2,
        )
        ctx.restore();

        if (!/^\d+$/.test(id)) { 
            ctx.save();
            ctx.fillStyle = '#FFF';
            ctx.fillRect(
                x * colWidth + 1,
                y * rowHeight + 1,
                imageWidth,
                rowHeight - fontHeight - 2,
            )
            ctx.restore();
            ctx.font = 'bold 12px sans-serif'
            ctx.fillText(
                id,
                (x + 0.5) * colWidth,
                (y + 0.5) * rowHeight - 4,
                imageWidth - 10,
            );
            continue;
        }

        loadImage(url, name, artist, el => {
            const { naturalWidth, naturalHeight } = el;
            const originRatio = el.naturalWidth / el.naturalHeight;

            let sw, sh, sx, sy;
            if (originRatio > canvasRatio) {
                sw = imageWidth * naturalHeight / imageHeight;
                sh = naturalHeight;
                sx = 0
                sy = (naturalHeight - sh) / 2
            } else {
                sh = naturalWidth * imageHeight / imageWidth;
                sw = naturalWidth;
                sx = (naturalWidth - sw) / 2
                sy = (naturalHeight - sh) / 2
            }

            ctx.drawImage(
                el,
                sx, sy,
                sw, sh,
                x * colWidth + 1,
                y * rowHeight + 1,
                imageWidth,
                imageHeight,
            );
            ctx.font = 'bold 12px sans-serif'
            ctx.fillText(
                name,
                (x + 0.5) * colWidth,
                (y + 0.5) * rowHeight + 26,
                imageWidth - 10,
            );
            ctx.font = '8px sans-serif'
            artistLines = getLines(ctx, artist, imageWidth - 10);
            if (artistLines.length == 1) {
                for (var i = 0; i<artistLines.length; i++)
                    ctx.fillText(artistLines[i], (x + 0.5) * colWidth, (y + 0.5) * rowHeight + 40 + (i * 10));
                return
            }
            else {
                ctx.font = '6px sans-serif'
                artistLines = getLines(ctx, artist, imageWidth - 10);
            }
            if (artistLines.length == 1) {
                for (var i = 0; i<artistLines.length; i++)
                    ctx.fillText(artistLines[i], (x + 0.5) * colWidth, (y + 0.5) * rowHeight + 40 + (i * 8));
            }
            else if (artistLines.length == 2) {
                for (var i = 0; i<artistLines.length; i++)
                    ctx.fillText(artistLines[i], (x + 0.5) * colWidth, (y + 0.5) * rowHeight + 36 + (i * 8));
            }
            else {
                ctx.font = '4px sans-serif'
                artistLines = getLines(ctx, artist, imageWidth - 10);
                for (var i = 0; i<artistLines.length; i++)
                    ctx.fillText(artistLines[i], (x + 0.5) * colWidth, (y + 0.5) * rowHeight + 35 + (i * 5));
            }
        })
    }
}

const outputEl = document.querySelector('.output-box');
const outputImageEl = outputEl.querySelector('img');
const showOutput = imgURL => {
    outputImageEl.src = imgURL;
    outputEl.setAttribute('data-show', true);
    htmlEl.setAttribute('data-no-scroll', true);
}
const closeOutput = () => {
    outputEl.setAttribute('data-show', false);
    htmlEl.setAttribute('data-no-scroll', false);
}

const downloadImage = () => {
    const fileName = 'vocalo_grid.jpg';
    const mime = 'image/jpeg';
    const imgURL = canvas.toDataURL(mime, 0.8);
    const linkEl = document.createElement('a');
    linkEl.download = fileName;
    linkEl.href = imgURL;
    linkEl.dataset.downloadurl = [mime, fileName, imgURL].join(':');
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);
    showOutput(imgURL);
}

canvas.onclick = e => {
    const rect = canvas.getBoundingClientRect();
    const { clientX, clientY } = e;
    const x = Math.floor(((clientX - rect.left) / rect.width * width - bodyMargin) / colWidth);
    const y = Math.floor(((clientY - rect.top) / rect.height * height - bodyMargin - titleHeight) / rowHeight);

    if (x < 0) return;
    if (x > col) return;
    if (y < 0) return;
    if (y > row) return;

    const index = y * col + x;

    if (index >= col * row) return;

    openSearchBox(index);
}

function renderBackground() {
    width = contentWidth + bodyMargin * 2;
    height = contentHeight + bodyMargin * 2 + titleHeight;

    canvas.width = width * scale;
    canvas.height = height * scale;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, width * scale, height * scale);

    ctx.textAlign = 'left';
    ctx.font = `${9 * scale}px sans-serif`;
    ctx.fillStyle = '#AAA';
    ctx.textBaseline = 'middle';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillText(
        'phystack.top/vocalo-grid  歌曲信息来自 VocaDB',
        19 * scale,
        (height - 10) * scale
    );

    ctx.scale(scale, scale);
    ctx.translate(bodyMargin, bodyMargin + titleHeight);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';

    ctx.save();
    ctx.font = 'bold 24px sans-serif';
    const titleText = isNewTable ? '术曲个人喜好表' : 'ボカロ生涯个人表格';
    ctx.fillText(titleText, contentWidth / 2, -24);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#222';

    for (let y = 0; y <= row; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * rowHeight);
        ctx.lineTo(contentWidth, y * rowHeight);
        ctx.globalAlpha = 1;
        ctx.stroke();

        if (y === row) break;
        ctx.beginPath();
        ctx.moveTo(0, y * rowHeight + rowHeight - fontHeight);
        ctx.lineTo(contentWidth, y * rowHeight + rowHeight - fontHeight);
        ctx.globalAlpha = .2;
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let x = 0; x <= col; x++) {
        ctx.beginPath();
        ctx.moveTo(x * colWidth, 0);
        ctx.lineTo(x * colWidth, contentHeight);
        ctx.stroke();
    }
    ctx.restore();

    for (let y = 0; y < row; y++) {
        for (let x = 0; x < col; x++) {
            const top = y * rowHeight;
            const left = x * colWidth;
            const type = types[y * col + x];
            ctx.fillText(
                type,
                left + colWidth / 2,
                top + rowHeight - fontHeight / 2,
            );
        }
    }
}

function initTable() {
    if (isNewTable) {
        types = typeTextsNew.trim().split(/\n+/g);
        vocaloSongsLocalKey = 'vocalo-songs-grid-new';
        row = 6;
        contentHeight = 900;
    } else {
        types = typeTextsOld.trim().split(/\n+/g);
        vocaloSongsLocalKey = 'vocalo-songs-grid';
        row = 4;
        contentHeight = 600;
    }
    
    getSongsFromLocalStorage();
    renderBackground();
    drawSongs();
}

const toggleBtn = document.createElement('button');
toggleBtn.innerText = '切换新/旧表格';
toggleBtn.style.position = 'fixed';
toggleBtn.style.top = '10px';
toggleBtn.style.right = '10px';
toggleBtn.style.zIndex = '9999';
toggleBtn.style.padding = '8px 16px';
toggleBtn.style.background = '#333';
toggleBtn.style.color = '#fff';
toggleBtn.style.border = 'none';
toggleBtn.style.borderRadius = '4px';
toggleBtn.style.cursor = 'pointer';
toggleBtn.onclick = () => {
    isNewTable = !isNewTable;
    initTable();
};
document.body.appendChild(toggleBtn);

initTable();
formEl.onsubmit();
