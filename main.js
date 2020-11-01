'use strict';
const elDrop = document.getElementById('dropzone');
const elSVG = document.getElementById('svg');
const elPng = document.getElementById('png');

elDrop.addEventListener('dragover', event => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  showDropping();
});

elDrop.addEventListener('dragleave', event => {
  hideDropping();
});

elDrop.addEventListener('drop', event => {
  event.preventDefault();
  hideDropping();
  showFiles(event.dataTransfer.files);
});

const showDropping = () => {
  elDrop.classList.add('dropover');
};

const hideDropping = () => {
  elDrop.classList.remove('dropover');
};

const append = (p, tag, attrs = {}) => {
  let c = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    c.setAttribute(key, value);
  }
  p.appendChild(c);
  return c;
}

const appendSVG = (p, tag, attrs = {}) => {
  let c = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) {
    c.setAttribute(key, value);
  }
  p.appendChild(c);
  return c;
};

const nowString = () => {
  let t = new Date();
  let y = t.getFullYear();
  let m = t.getMonth() + 1;
  let d = t.getDate();
  return `${y}-${m}-${d}`;
};

const toTick = (s) => {
  let m = s.match(/(\d+)\D+(\d+)\D+(\d+)/);
  let yy = parseInt(m[1], 10);
  let mm = parseInt(m[2], 10);
  let dd = parseInt(m[3], 10);
  return (new Date(yy, mm, dd)).getTime();
}

const rangeOf = (o) => {
  let dMin = 1e100;
  let dMax = -1e100;
  let now = nowString();
  for (let m of o.members) {
    dMin = Math.min(dMin, toTick(m.in));
    dMax = Math.max(dMax, toTick(m.out || o.end || now));
  }
  const month = 1000 * 60 * 60 * 24 * 32;
  return { min: dMin - month, max: dMax };
};

const xpos = (m, tText) => {
  const t = toTick(tText);
  const d = (t - m.range.min) / (m.range.max - m.range.min);
  return d * m.w * (1 - m.name_ratio) + m.w * m.name_ratio;
};

const toYear = (t, delta) => {
  let d = new Date();
  d.setTime(t);
  if (delta < 0) {
    return d.getFullYear();
  }
  if (d.getMonth() == 0 && d.getDate() == 1) {
    return d.getFullYear();
  }
  return d.getFullYear() + 1;
};

const toYYMM = (t, delta) => {
  let d = new Date();
  d.setTime(t);
  if (delta < 0) {
    return d.getFullYear() * 12 + d.getMonth();
  }
  if (d.getDate() == 1) {
    return d.getFullYear() * 12 + d.getMonth();
  }
  return d.getFullYear() * 12 + d.getMonth() + 1;
};

const btoaUtf8 = (str) => {
  let codes = new TextEncoder("utf-8").encode(str);
  let r = "";
  for (let c of codes) {
    r += String.fromCharCode(c);
  }
  return btoa(r);
};

const svg2jpeg = (svgElement, sucessCallback, errorCallback) => {
  var canvas = document.createElement('canvas');
  canvas.width = svgElement.width.baseVal.value;
  canvas.height = svgElement.height.baseVal.value;
  var ctx = canvas.getContext('2d');
  var image = new Image;

  image.onload = () => {
    ctx.drawImage(image, 0, 0, image.width, image.height);
    sucessCallback(canvas.toDataURL());
  };
  image.onerror = (e) => {
    errorCallback(e);
  };
  let svgData = new XMLSerializer().serializeToString(svgElement);
  image.src = 'data:image/svg+xml;charset=utf-8;base64,' + btoaUtf8(svgData);
};

const bulidSVG = (o, svgOwner, pngOwner) => {
  svgOwner.innerHTML = ""
  const pstyle = `height:${o.height}${o.unit};width:${o.width}${o.unit}`;
  svgOwner.setAttribute("style", pstyle)
  let now = nowString();
  const gap = 3;
  const gh = o.members.length * 10;
  const th = o.members.length * 11;
  const w = (th + gap * 2) * o.width / o.height - gap
  let range = rangeOf(o);
  let svg = appendSVG(svgOwner, "svg", {
    xmlns: "http://www.w3.org/2000/svg",
    height: o.height + o.unit,
    width: o.width + o.unit,
    viewBox: `${-gap} ${-gap} ${w + gap} ${th + gap * 2}`
  });
  let graphs = appendSVG(svg, "g", { fill: "#eee" });
  let measure = {
    range: rangeOf(o),
    w: w,
    name_ratio: o.name_ratio || 0.2,
  };
  for (let i = 0; i < o.members.length; ++i) {
    let m = o.members[i];
    let col = m.color || "rgb(0,0,255)";
    let start = xpos(measure, m.in);
    let end = xpos(measure, m.out || o.end || now);
    const barH = 3;
    appendSVG(graphs, "rect", {
      height: barH,
      width: end - start,
      x: start,
      y: i * 10 + (10 - barH) / 2,
      style: `fill: ${col}`,
    });
    if (i % 2 == 1) {
      appendSVG(graphs, "rect", {
        height: 10,
        width: w * 3,
        x: -w,
        y: i * 10,
        style: `fill: rgba(0,0,0,0.07)`,
      });
    }
  }
  let mYearGrid = appendSVG(svg, "g", {
    stroke: "black",
    style: `stroke-width:${w / 400}; opacity:0.5`
  });
  let mThickGrid = appendSVG(svg, "g", {
    stroke: "black",
    style: `stroke-width:${w / 800}; opacity:0.5`,
    "stroke-dasharray": "1,0.5"
  });
  let mThinGrid = appendSVG(svg, "g", {
    stroke: "black",
    style: `stroke-width:${w / 1600}; opacity:0.2`,
    "stroke-dasharray": "0.5,1"
  });
  let nameTexts = appendSVG(svg, "g", {
    fill: "#000",
    "font-size": 4,
    "font-family": "sans-serif",
    lang: "ja"
  });
  let yearTexts = appendSVG(svg, "g", {
    fill: "#000",
    "font-size": 3,
    "font-family": "sans-serif",
    lang: "ja"
  });
  for (let yymm = toYYMM(range.min, -1); yymm <= toYYMM(range.max, 1); ++yymm) {
    let x = xpos(measure, `${Math.floor(yymm / 12)}-${(yymm % 12) + 1}-1`);
    let grid = () => {
      if (yymm % 12 == 0) { return mYearGrid; }
      if (yymm % 3 == 0) { return mThickGrid; }
      return mThinGrid;
    };
    appendSVG(grid(), "line", {
      x1: x, x2: x,
      y1: 0, y2: gh
    });
    if (yymm % 12 == 0 && yymm + 2 < toYYMM(range.max, 1)) {
      const year = Math.floor(yymm / 12);
      let text = appendSVG(yearTexts, "text", {
        lang: "ja",
        x: x, y: gh + 3,
        "text-anchor": "middle"
      });
      text.innerHTML = year;
    }
  }
  for (let i = 0; i < o.members.length; ++i) {
    let text = appendSVG(nameTexts, "text", {
      lang: "ja",
      x: 1,
      y: i * 10 + 7
    });
    text.innerHTML = o.members[i].name;
  }
  // 使い方
  svg2jpeg(svg, function (data) {
    document.getElementById('png-image').src = data;
  }, function (error) {
    console.log(error);
  })
};

const showFiles = (files) => {
  elSVG.innerHTML = '';
  if (1 != files.length) {
    alert("Not a single file was drpoped.");
    return;
  }
  let file = files[0];
  console.log(files);
  if ("application/json" != file.type) {
    alert(`dropped file ${file.name} is not a json`);
    return;
  }
  let reader = new FileReader();
  reader.onload = (e) => {
    let o = JSON.parse(e.target.result);
    bulidSVG(o, elSVG, elPng);
  }
  reader.readAsText(file);
};

bulidSVG({
  width: 1600,
  height: 800,
  graph_left: 100,
  unit: "px",
  members: [
    {
      name: "橋村 理子",
      in: "2017年2月25日",
      out: "2019年7月29日",
    },
    {
      name: "髙萩 千夏",
      in: "2017年2月25日",
    },
    {
      name: "吉川 茉優",
      in: "2017年2月25日",
    },
    {
      name: "鍛治島 彩",
      in: "2017年2月25日",
    },
    {
      name: "中沖 凜",
      in: "2017年3月18日",
      out: "2018年12月31日"
    },
    {
      name: "中川 千尋",
      in: "2018年4月21日",
    },
    {
      name: "佐々木 ほのか",
      in: "2018年4月21日",
    },
    {
      name: "森永 新菜",
      in: "2019年3月3日",
    },
    {
      name: "島崎 友莉亜",
      in: "2019年3月3日",
    },
    {
      name: "新倉 愛海",
      in: "2019年3月3日",
    },
  ]
}, elSVG, elPng);
