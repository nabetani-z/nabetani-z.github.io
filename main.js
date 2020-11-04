'use strict';
const elDrop = document.getElementById('dropzone');
const elSVG = document.getElementById('svg');
const elPng = document.getElementById('png');
const elJsonText = document.getElementById('json_text');

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
  onDropFiles(event.dataTransfer.files);
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

const appendSVG = (p, tag, attrs = {}, inner = null) => {
  let c = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) {
    c.setAttribute(key, value);
  }
  p.appendChild(c);
  if (inner) {
    c.innerHTML = inner;
  }
  return c;
};

const nowString = () => {
  let t = new Date();
  let y = t.getFullYear();
  let m = t.getMonth() + 1;
  let d = t.getDate();
  return `${y}-${m}-${d}`;
};

const toHanNumber = (s) => {
  return s.replace(/[０１２３４５６７８９]/g, (m) => {
    return {
      '０': '0',
      '１': '1',
      '２': '2',
      '３': '3',
      '４': '4',
      '５': '5',
      '６': '6',
      '７': '7',
      '８': '8',
      '９': '9',
    }[m];
  });
};

const toTick = (s) => {
  let m = toHanNumber(s).match(/(\d+)\D+(\d+)\D+(\d+)/);
  let yy = parseInt(m[1], 10);
  let mm = parseInt(m[2], 10);
  let dd = parseInt(m[3], 10);
  return (new Date(yy, mm, dd)).getTime();
};

const rangeOf = (o) => {
  let dMin = 1e100;
  let dMax = -1e100;
  let now = nowString();
  for (let m of o.members) {
    if (m.in) {
      dMin = Math.min(dMin, toTick(m.in));
      dMax = Math.max(dMax, toTick(m.out || o.end));
    }
    for (let e of m.enrollments || []) {
      dMin = Math.min(dMin, toTick(e.in));
      dMax = Math.max(dMax, toTick(e.out || o.end));
    }
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

const calcHeight = (o, o_width) => {
  const mc = o.members.length;
  return o_width / 25 * (mc + 0.7);
};

const whiteBack = (svg, w, h) => {
  appendSVG(svg, "rect", {
    height: h * 3,
    width: w * 3,
    x: -w,
    y: -h,
    style: "fill:white",
  });
};

const gridLayer = (svg, stroke_w, opacity, dash = null) => {
  return appendSVG(svg, "g", {
    stroke: "black",
    style: `stroke-width:${stroke_w}; opacity:${opacity}`,
    ...(dash ? { "stroke-dasharray": dash } : {})
  });
};

const textLayer = (svg, fontSize) => {
  return appendSVG(svg, "g", {
    fill: "#000",
    "font-size": fontSize,
    "font-family": "sans-serif",
    lang: "ja"
  });
};

const addBar = (graphs, start, end, i, col0, bcol) => {
  const barH = 5;
  const col = col0 || "rgb(0,0,255)";
  const barStyle = `fill: ${col}; stroke-width:${bcol ? 0.3 : 0}`
  appendSVG(graphs, "rect", {
    height: barH,
    width: end - start,
    x: start,
    stroke: (bcol || "rgb(0,0,0,0)"),
    y: i * 10 + (10 - barH) / 2,
    style: barStyle,
  });
};

const createPng = (o, svgOwner, hidePrompt) => {
  elJsonText.value = JSON.stringify(o, null, "  ");
  svgOwner.innerHTML = ""
  const unit = o.unit || "px";
  const o_width = o.width || 1600;
  const o_height = o.height || calcHeight(o, o_width);
  const pstyle = `height:${o_height}${unit};width:${o_width}${unit}`;
  svgOwner.setAttribute("style", pstyle)
  const now = nowString();
  const gap = 3;
  const gh = o.members.length * 10;
  const th = o.members.length * 11;
  const w = (th + gap * 2) * o_width / o_height - gap
  const range = rangeOf(o);
  const svg = appendSVG(svgOwner, "svg", {
    xmlns: "http://www.w3.org/2000/svg",
    height: o_height + unit,
    width: o_width + unit,
    viewBox: `${-gap} ${-gap - 5} ${w + gap} ${th + gap * 2}`
  });
  whiteBack(svg, w, th);
  const mYearGrid = gridLayer(svg, w / 400, 0.5);
  const mThickGrid = gridLayer(svg, w / 800, 0.5, "1,0.5");
  const mThinGrid = gridLayer(svg, w / 1600, 0.2, "0.5,1");
  const nameTexts = textLayer(svg, 5);
  const yearTexts = textLayer(svg, 3);
  const graphs = appendSVG(svg, "g");
  const events = gridLayer(svg, w / 600, 1, "1,1");
  let textWMax = 0;
  for (let i = 0; i < o.members.length; ++i) {
    const text = appendSVG(nameTexts, "text", {
      lang: "ja",
      x: 1,
      y: i * 10 + 7
    }, o.members[i].name);
    textWMax = Math.max(textWMax, text.getBBox().width);
  }
  const measure = {
    range: rangeOf(o),
    w: w,
    name_ratio: (textWMax + 5) / w
  };
  if (o.events) {
    for (let e of o.events) {
      const x = xpos(measure, e.t);
      const color = e.color || "black";
      appendSVG(events, "line", {
        x1: x, x2: x,
        y1: 0, y2: gh + 2,
        style: `stroke: ${color}`,
      });
      appendSVG(yearTexts, "text", {
        lang: "ja",
        x: x,
        y: gh + 6,
        "text-anchor": "middle",
        style: `fill: ${color}`
      }, e.label);
    }
  }
  for (let i = 0; i < o.members.length; ++i) {
    if (i % 2 == 1) {
      appendSVG(graphs, "rect", {
        height: 10,
        width: w * 3,
        x: -w,
        y: i * 10,
        style: `fill: rgba(0,0,0,0.07)`,
      });
    }
    const m = o.members[i];
    if (m.in) {
      addBar(graphs,
        xpos(measure, m.in),
        xpos(measure, m.out || o.end),
        i,
        m.color,
        m.border_color);
    }
    for (let e of m.enrollments || []) {
      addBar(graphs,
        xpos(measure, e.in),
        xpos(measure, e.out || o.end),
        i,
        e.color || m.color,
        e.color ? e.border_color : m.border_color);
    }
  }
  for (let yymm = toYYMM(range.min, -1); yymm <= toYYMM(range.max, 1); ++yymm) {
    const x = xpos(measure, `${Math.floor(yymm / 12)}-${(yymm % 12) + 1}-1`);
    const grid = () => {
      if (yymm % 12 == 0) { return mYearGrid; }
      if (yymm % 3 == 0) { return mThickGrid; }
      return mThinGrid;
    };
    appendSVG(grid(), "line", {
      x1: x, x2: x,
      y1: -2, y2: gh
    });
    if (yymm % 12 == 0 && yymm + 2 < toYYMM(range.max, 1)) {
      const year = Math.floor(yymm / 12);
      appendSVG(yearTexts, "text", {
        lang: "ja",
        x: x, y: -3,
        "text-anchor": "middle"
      }, year);
    }
  }
  svg2jpeg(svg, (data) => {
    if (hidePrompt) {
      const elPrompt = document.getElementById('png-prompt');
      elPrompt.style.display = "none";
    }
    const elImg = document.getElementById('png-image');
    elImg.src = data;
    elImg.style.width = "100%";
  }, (error) => {
    console.log(error);
    alert(error);
  })
};

const onDropFiles = (files) => {
  elSVG.innerHTML = '';
  if (1 != files.length) {
    alert("Not a single file was drpoped.");
    return;
  }
  let file = files[0];
  if ("application/json" != file.type) {
    alert(`dropped file ${file.name} is not a json`);
    return;
  }
  let reader = new FileReader();
  reader.onload = (e) => {
    let o = JSON.parse(e.target.result);
    if (!o.end) {
      o.end = nowString();
    }
    let json = JSON.stringify(o);
    history.pushState('', '', `?json=${encodeURIComponent(json)}`);
    createPng(o, elSVG, true);
  }
  reader.readAsText(file);
};

const sampleGraph = () => {
  createPng({
    "width": 1600,
    "height": 500,
    "end": "2019.12.24",
    "members": [
      {
        "name": "最後までいた初期メン",
        "in": "2016年1月1日",
        "color": "green"
      },
      {
        "name": "半年で卒業した初期メン",
        "in": "2016年1月1日",
        "out": "2016年7月12日",
        "color": "white",
        "border_color": "black"
      },
      {
        "name": "途中加入で最後までいた人",
        "in": "2016年4月7日",
        "color": "red"
      },
      {
        "name": "途中加入ですぐ卒業した人",
        "in": "2016年4月7日",
        "out": "2016年4月28日",
        "color": "#00f"
      },
      {
        "name": "一年ぐらいで卒業した人",
        "in": "２０１７年９月６日",
        "out": "２０１８年９月３１日",
        "color": "#00ffee"
      },
      {
        "name": "卒業したあとで復帰して卒業した人",
        "color": "violet",
        "enrollments": [
          {
            "in": "2016.5.6",
            "out": "2017.12.20",
          },
          {
            "in": "2018.8.1",
            "out": "2019.8.2",
          }
        ]
      },
      {
        "name": "卒業したあとで復帰して、担当カラーが変わった人",
        "enrollments": [
          {
            "in": "2016.5.6",
            "out": "2017.7.1",
            "color": "aqua"
          },
          {
            "in": "2018.3.15",
            "color": "yellow",
            "border_color": "black"
          }
        ]
      }
    ],
    "events": [
      {
        "label": "1S",
        "t": "2016.6.15",
        "color": "brown",
      },
      {
        "label": "2S",
        "t": "2017年4月14日",
        "color": "brown",
      },
      {
        "label": "3S",
        "t": "2018.6.1",
        "color": "brown",
      },
      {
        "label": "M1A",
        "t": "2019.1.15",
        "color": "darkblue",
      },
      {
        "label": "M1S",
        "t": "2019.6.1",
        "color": "brown",
      },
      {
        "label": "M2A",
        "t": "2019.11.15",
        "color": "darkblue",
      },
    ]
  }, elSVG, false);
}


const getQJson = (s) => {
  const m = s.match(/json\=([^&]+)/);
  if (!m) {
    return null;
  }
  const json = decodeURIComponent(m[1]);
  return JSON.parse(json);
}

const main = () => {
  let qjson = getQJson(location.search);
  if (qjson) {
    createPng(qjson, elSVG, true);
  } else {
    sampleGraph();
  }
};

main();