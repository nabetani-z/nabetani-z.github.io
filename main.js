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
}

const bulidSVG = (o, e) => {
  e.innerHTML = ""
  let pstyle = `height:${o.height}${o.unit};width:${o.width}${o.unit}`;
  e.setAttribute("style", pstyle)
  let svg = appendSVG(e, "svg", {
    xmlns: "http://www.w3.org/2000/svg",
    height: o.height + o.unit,
    width: o.width + o.unit,
    viewBox: "-1 -1 38 38"
  });
  appendSVG(svg, "circle", { cx: 50, cy: 50, r: 40, stroke: "black", "stroke-width": 3, fill: "red" });
}

const showFiles = (files) => {
  elSVG.innerHTML = '';
  if (1 < files.length) {
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
    bulidSVG(o, elSVG);
    elSVGText.innerText = elSVG.innerHTML;
  }
  reader.readAsText(file);
};

bulidSVG({
  width: "500",
  height: "500",
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
