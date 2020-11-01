'use strict';
const elDrop = document.getElementById('dropzone');
const elSVG = document.getElementById('svg');
const elSVGText = document.getElementById('svgText');

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
  return { min: dMin, max: dMax };
};

const xpos = (w, range, tText) => {
  const t = toTick(tText);
  const d = (t - range.min) / (range.max - range.min);
  return d * w * 0.8 + w * 0.2;
};


const bulidSVG = (o, e) => {
  console.log(JSON.stringify(o));
  e.innerHTML = ""
  const pstyle = `height:${o.height}${o.unit};width:${o.width}${o.unit}`;
  e.setAttribute("style", pstyle)
  let now = nowString();
  const gap = 3;
  const h = o.members.length * 10;
  const w = (h + gap * 2) * o.width / o.height - gap * 2
  let range = rangeOf(o);
  let svg = appendSVG(e, "svg", {
    xmlns: "http://www.w3.org/2000/svg",
    height: o.height + o.unit,
    width: o.width + o.unit,
    viewBox: `${-gap} ${-gap} ${w + gap * 2} ${h + gap * 2}`
  });
  let graphs = appendSVG(svg, "g", { fill: "#eee" });
  for (let i = 0; i < o.members.length; ++i) {
    let m = o.members[i];
    let col = m.color || "rgb(0,0,255)";
    let start = xpos(w, range, m.in);
    let end = xpos(w, range, m.out || o.end || now);
    const barH = 3;
    appendSVG(graphs, "rect", {
      height: barH,
      width: end - start,
      x: start,
      y: i * 10 + (10 - barH) / 2,
      style: `fill: ${col}`,
    });
  }
  let texts = appendSVG(svg, "g", {
    fill: "#000",
    "font-size": 4,

  });
  for (let i = 0; i < o.members.length; ++i) {
    let text = appendSVG(texts, "text", { x: 1, y: i * 10 + 7 });
    text.innerHTML = o.members[i].name;
  }
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
    bulidSVG(o, elSVG);
    elSVGText.innerText = elSVG.innerHTML;
  }
  reader.readAsText(file);
};

bulidSVG({
  width: 800,
  height: 400,
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
}, elSVG);
elSVGText.innerText = elSVG.innerHTML;
