let map = L.map("map");

map.createPane("tilePane");
map.getPane("tilePane").style.zIndex = 650;

// Basemap
let url = "mapima/{z}/{x}/{y}.png";
basemap = L.tileLayer(url, {
  maxZoom: 6,
  minZoom: 4,
  pane: "tilePane",
}).addTo(map);

maplabel = L.tileLayer("maplabel/{z}/{x}/{y}.png", {
  maxZoom: 6,
  minZoom: 4,
  pane: "tilePane",
}).addTo(map);
map.getContainer().style.background = "rgba(164, 205, 255)";

let vf = null;
let s = null;
let magnitude = null;
let direction = null;
var animation = null;
let control = null;

function initMap(date, time) {
  d3.text(`data/ASCData/${date}/ASCU/${time}.asc`, function (u) {
    d3.text(`data/ASCData/${date}/ASCV/${time}.asc`, function (v) {
      const toMetersPerSecond = 0.01;
      vf = L.VectorField.fromASCIIGrids(u, v, toMetersPerSecond);

      s = vf.getScalarField("magnitude");

      magnitude = L.canvasLayer.scalarField(s, {
        color: chroma.scale("Spectral").domain([0.2, 0]),
        opacity: 0.6,
      });

      // b) Second derived field: DirectionFrom (º): (0 to 360º) | N is 0º and E is 90º
      direction = L.canvasLayer.scalarField(
        vf.getScalarField("directionFrom"),
        {
          type: "vector",
          color: "white",
          vectorSize: 25,
          arrowDirection: "from",
        }
      );

      animation = L.canvasLayer
        .vectorFieldAnim(vf, {
          paths: 5000,
          fade: 0.97,
          maxAge: 100,
          velocityScale: 1 / 10,
          color: "rgba(255, 255, 255, 0.7)",
        })
        .addTo(map);

      control = L.control
        .layers(
          {},
          {
            矢量图层: animation,
            热力图层: magnitude,
            风向: direction,
          },
          {
            position: "bottomleft",
            collapsed: false,
          }
        )
        .addTo(map);

      map.fitBounds(animation.getBounds());

      magnitude.on("click", function (e) {
        if (e.value !== null) {
          let v = e.value.toFixed(2);
          let html = `<span class="popupText">风速: ${v * 10} m/s</span>`;
          let popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(html)
            .openOn(map);
        }
      });

      direction.on("click", function (e) {
        if (e.value !== null) {
          let v = e.value.toFixed(0);
          let html = `<span class="popupText">方向: ${v}°</span>`;
          let popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(html)
            .openOn(map);
        }
      });
    });
  });
}

function updateMap(date, time) {
  d3.text(`data/ASCData/${date}/ASCU/${time}.asc`, function (u) {
    d3.text(`data/ASCData/${date}/ASCV/${time}.asc`, function (v) {
      vf = L.VectorField.fromASCIIGrids(u, v, 0.01);
      s = vf.getScalarField("magnitude");
      // map.removeLayer(animation);
      control.removeLayer(animation);
      control.removeLayer(magnitude);
      control.removeLayer(direction);
      if_add = false;
      map.eachLayer(function (layer) {
        if (layer !== basemap && layer !== maplabel) {
          map.removeLayer(layer);
          if (layer == magnitude) {
            if_add = true;
          }
        }
      });
      animation = L.canvasLayer
        .vectorFieldAnim(vf, {
          paths: 5000,
          fade: 0.97,
          maxAge: 100,
          velocityScale: 1 / 10,
          color: "rgba(255, 255, 255, 0.7)",
        })
        .addTo(map);
      magnitude = L.canvasLayer.scalarField(s, {
        color: chroma.scale("Spectral").domain([0.2, 0]),
        opacity: 0.6,
      });
      if (if_add) magnitude.addTo(map);
      direction = L.canvasLayer.scalarField(
        vf.getScalarField("directionFrom"),
        {
          type: "vector",
          color: "white",
          vectorSize: 25,
          arrowDirection: "from",
        }
      );
      control.addOverlay(animation, "矢量图层");
      control.addOverlay(magnitude, "热力图层");
      control.addOverlay(direction, "风向");

      magnitude.on("click", function (e) {
        if (e.value !== null) {
          let v = e.value.toFixed(2);
          let html = `<span class="popupText">风速: ${v * 10} m/s</span>`;
          let popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(html)
            .openOn(map);
        }
      });

      direction.on("click", function (e) {
        if (e.value !== null) {
          let v = e.value.toFixed(0);
          let html = `<span class="popupText">方向: ${v}°</span>`;
          let popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(html)
            .openOn(map);
        }
      });
    });
  });
}

initMap("20210101", "00");

console.log(animation);

let width = document.getElementById("width");
width.addEventListener("input", function () {
  animation.options.width = width.value;
});

let color = document.getElementById("color");
color.addEventListener("input", function () {
  animation.options.color = color.value;
});

let velocityScale = document.getElementById("velocityScale");
velocityScale.addEventListener("input", function () {
  animation.options.velocityScale = 1 / velocityScale.value;
});

let opacity = document.getElementById("opacity");
opacity.addEventListener("input", function () {
  animation.setOpacity(opacity.value);
});

let magnitude_opacity = document.getElementById("magnitude_opacity");
magnitude_opacity.addEventListener("input", function () {
  magnitude.setOpacity(magnitude_opacity.value);
});

// let dateTime = document.getElementById("dateTime");
// dateTime.addEventListener("input", function () {
//   // dateTime = parseFloat(dateTime.value);
//   date = Math.floor(dateTime.value);
//   time = dateTime.value % 1;
//   time = parseInt((time * 3) / 0.125)
//     .toString()
//     .padStart(2, "0");

//   updateMap(date, time);
// });

// let intervalId; // 用于存储定时器的 ID
// let isManuallyClicked = false; // 用于标记是否发生了人为点击

// // 点击事件处理函数
// function handleClick() {
//   isManuallyClicked = true; // 设置为发生了人为点击
//   clearInterval(intervalId); // 清除之前的定时器

//   // 获取点击的位置，计算对应的时间
//   let clickPosition = parseFloat(dateTime.value);
//   let currentDate = Math.floor(clickPosition);
//   let currentTime = clickPosition % 1;
//   let currentTimeIndex = parseInt((currentTime * 3) / 0.125);

//   // 设置定时器，每隔一定时间更新时间组件的数值
//   intervalId = setInterval(function () {
//     // 增加时间索引
//     currentTimeIndex++;

//     // 超过最大索引，重置为0
//     if (currentTimeIndex > 24) {
//       currentTimeIndex = 0;
//     }

//     // 更新时间组件的值
//     dateTime.value = (currentDate + currentTimeIndex * 0.125).toFixed(3);

//     // 触发输入事件，以便执行相应的事件处理函数
//     dateTime.dispatchEvent(new Event("input"));
//   }, 5000); // 每隔一秒更新一次时间组件的值
// }

// // 注册点击事件监听器
// dateTime.addEventListener("click", handleClick);

// // 设置定时器，用于始终自动增加
// setInterval(function () {
//   if (!isManuallyClicked) {
//     // 获取当前时间值
//     let currentValue = parseFloat(dateTime.value);

//     // 更新时间组件的值，继续自动增加
//     dateTime.value = (currentValue + 0.125).toFixed(3);

//     // 触发输入事件，以便执行相应的事件处理函数
//     dateTime.dispatchEvent(new Event("input"));
//   }
// }, 5000); // 每隔一秒更新一次时间组件的值

// setInterval(function () {
//   currentYear = Math.floor(Math.floor(dateTime.value) / 10000);
//   currentMonth = Math.floor((Math.floor(dateTime.value) % 10000) / 100);
//   currentDay = Math.floor(dateTime.value) % 100;
//   currentHour = 24 * (dateTime.value % 1);
//   currentTime = `${currentYear}年${currentMonth}月${currentDay}日${currentHour}时`;
//   document.getElementById("currentTime").innerHTML = currentTime;
// }, 500);
