var cueParts = [];
var cueHtml = [];
var isEditor = false;
const addButton = `
<div class="song" id="addButton" style="padding-left: 50; padding-right: 50; text-align: center; font-size: 30px;" onclick="addSong()"><p style="user-select: none;">Add song</p></div>
`
const saveButton = `
<div class="song" style="padding-left: 25; padding-right: 25; text-align: center; font-size: 18px;" onclick="addSong()"><a id="saveLink">Save (right click and then click Save Link As)</a></div>
`
function pd(evt) {
  evt.preventDefault();
}
var ra
try {ra = replaceAll} catch(e) {ra = false}
if (!ra) {
  String.prototype.replaceAll = function(t, r) {
    var st = this
    while (st.includes(t)) {
      st = st.replace(t, r)
    }
    return st
  }
}

Array.prototype.insertAt = function(index, value) {
  this.splice(index, 0, value)
}

var CUETrack = function() {
  this.filename = "";
  this.ext = "";
  this.trackno = 0;
  this.start = {
    mins: 0,
    secs: 0,
    frames: 0
  };
  this.haspregap = false;
  this.pregap = {
    mins: 0,
    secs: 0,
    frames: 0
  };
}

function el(e) {
  return document.getElementById(e);
}

function qs(q) {
  return document.querySelector(q);
}

function qsa(q) {
  return document.querySelectorAll(q);
}

function createOpenDialog() {
  window.cfile = false;
  el("content").innerHTML = `
  <div class=cn style="display: block;">
  <h3>Upload your CUE file here</h3>
  <br><br>
  <input id="cueOpen" type="file" style="border-style: solid; border-color: white;" accept=".cue">
  <br><br>
  <button class=med onclick="checkCUE()">OK</button>
  </div>
  `
}

function checkCUE() {
  if (!el('cueOpen').files[0]) {
    alert("Grrrrrrrgh! You didn't upload a file!")
  } else {
    readCUE(el('cueOpen').files[0])
  }
}

function readCUE(f) {
  var r = new FileReader();
  r.readAsText(f, "UTF-8")
  r.onload = function(evt) {
    window.cfile = evt.target.result;
    processCUE(window.cfile);
  }
}

function processCUE(c) {
  console.log(c);
  var processedCue = c.replaceAll("  ", "").split("\n")
  console.log(processedCue)
  cueParts = []
  var curcue = "placeholder";
  for (let i of processedCue) {
    if (i.includes("FILE \"")) {

      cueParts.push(curcue);
      curcue = new CUETrack();
      curcue.filename = i.split('FILE "')[1].split('"')[0];
      curcue.ext = curcue.filename.split(".")[1]

    } else if (i.includes("TRACK ") && !i.includes("FILE \"")) {

      curcue.trackno = parseInt(i.split("TRACK ")[1].split(" ")[0]);

    } else if (i.includes("INDEX ") && !i.includes("FILE \"")) {

      var ino = parseInt(i.split("INDEX ")[1].split(" ")[0])
      switch (ino) {
        case 0:
          curcue.haspregap = true;
          var tm = i.split("INDEX ")[1].split(" ")[1].split(":");
          curcue.pregap = {mins: parseInt(tm[0]), secs: parseInt(tm[1]), frames: parseInt(tm[2])};
          break;
        case 1:
          var tm = i.split("INDEX ")[1].split(" ")[1].split(":");
          curcue.start = {mins: parseInt(tm[0]), secs: parseInt(tm[1]), frames: parseInt(tm[2])};
          break;
        default:
          console.log("This index doesn't matter")
      }

    } else {
      console.log([i, "Doesn't matter, skipping!"])
    }
  }
  cueParts.shift()
  cueParts.push(curcue)
  console.log(cueParts)
  renderCue()
  isEditor = true;

}

function renderCue() {
  cueHtml = []
  for (let i of cueParts) {
    cueHtml.push(cueToHTML(i))
  }
  var megatron = cueHtml.join("");
  el("content").innerHTML = `${cueParts.length > 0 ? saveButton : ""}` + megatron + addButton

  //Save button code
  var blob = new Blob([createCueFile()], { type: 'text/plain' })
  var a = el("saveLink");
  a.download = "levelpack.cue";
  a.href = (window.webkitURL || window.URL).createObjectURL(blob);
  a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');


}

function toDoubleDigits(n) {
  if (n.toString().length < 10) {
    return '0' + n;
  }
  return n;
}

function createCueFile() {
  var cueStr = ""
  for (let i of cueParts) {
    var tempstr = "";
    tempstr += `FILE "${i.filename}" BINARY\n`
    tempstr += `\tTRACK ${toDoubleDigits(i.trackno)} AUDIO\n`
    tempstr += `\t\tINDEX 01 00:00:00\n`
    cueStr += tempstr
  }
  return cueStr
}

function refreshList() {
  for (let i = 0; i < cueParts.length; i++) {
    cueParts[i].trackno = i + 1;
  }
}

function moveUp(t) {
  saveNames()
  var l = cueParts.length - 1;
  if (t == 1) {
    [cueParts[l], cueParts[0]] = [cueParts[0], cueParts[l]]
  } else {
    [cueParts[t-2], cueParts[t-1]] = [cueParts[t-1], cueParts[t-2]]
  }
  refreshList();
  renderCue();
}

function moveDown(t) {
  saveNames()
  var l = cueParts.length - 1;
  if (t == l+1) {
    [cueParts[0], cueParts[l]] = [cueParts[l], cueParts[0]]
  } else {
    [cueParts[t-1], cueParts[t]] = [cueParts[t], cueParts[t-1]]
  }
  refreshList();
  renderCue();
}

function dupe(t) {
  saveNames()
  thing = cueParts[t-1]
  console.log(thing)
  newone = new CUETrack();
  newone.trackno = t+1
  newone.filename = thing.filename
  newone.ext = thing.ext
  newone.start = thing.start
  newone.haspregap = thing.haspregap
  newone.pregap = thing.pregap
  cueParts.insertAt(t, newone)
  refreshList();
  renderCue();
}

function del(t) {
  saveNames()
  cueParts.splice(t-1, 1);
  refreshList();
  renderCue();
}

function saveNames() {
  for (let i = 1; i <= cueParts.length; i++) {
    cueParts[i-1].filename = el("title" + i).value
  }
}

function handleKeyPress(evt) {
  if (evt.keyCode == 13) {
    saveNames()
    console.log("Saved!")
    refreshList();
    renderCue();
  }
}

function addSong(name = "New track.wav") {
  saveNames()
  var s = new CUETrack();
  s.filename = name;
  s.trackno = cueParts.length;
  cueParts.push(s);
  refreshList();
  renderCue();
}

function handleDrop(evt) {
  if (isEditor) {
    var f = evt.dataTransfer.files
    for (let i of f) {
      addSong(i.name)
    }
  }
  pd(evt)
}

function createCue() {
  cueParts = [];
  var s = new CUETrack();
  s.filename = "New track.wav";
  s.trackno = 1;
  cueParts.push(s);
  isEditor = true;
  refreshList();
  renderCue();

}

function cueToHTML(cueObj) {
  return `
  <div id="song${cueObj.trackno}" class="song">
  <input value=${cueObj.trackno} disabled style="width: 60px; font-size: 30px; border: none;">
  <input id="title${cueObj.trackno}" value="${cueObj.filename}" type="text" style="font-size: 30px; width: 700px; border-bottom: solid black; outline: none;" onkeydown="handleKeyPress(event)">
  <img src="upArrow.png" width="30" height="30" onclick="moveUp(${cueObj.trackno})">
  <img src="downArrow.png" width="30" height="30" onclick="moveDown(${cueObj.trackno})">
  <img src="dupe.png" width="30" height="30" onclick="dupe(${cueObj.trackno})">
  <img src="delete.png" width="30" height="30" onclick="del(${cueObj.trackno})">
  </div>
  `
}
