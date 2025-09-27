var cueParts = [];
var cueHtml = [];
var debug_trackList = [];
var isEditor = false;
var baseUrl = window.location.href.split("#")[0];
var isMobile = document.body.clientWidth < 768;
const addButton = `
<div class="song" id="addButton" style="padding-left: 50; padding-right: 50; text-align: center; font-size: 30px;" onclick="addFile()"><p style="user-select: none;">${tr("add_file")}</p></div>
`
const saveButton = `
<div class="song saveButton" style="padding-left: 25; padding-right: 25; text-align: center; font-size: 18px;" onmousedown="organize()">
  <a id="saveLink">${tr("save_link")}</a>
  <a id="saveLinkMobile" onpointerup="downloadBlob()">${tr("save_link_mobile")}</a>
</div>
`

function downloadBlob() {
  // dev.to/nombrekeff/download-file-from-blob-21ho
  organize()
  // Convert your blob into a Blob URL (a special url that points to an object in the browser's memory)
  const blobUrl = el("saveLink").href
  var name = "levelpack.cue"

  // Create a link element
  const link = document.createElement("a");

  // Set link's href to point to the Blob URL
  link.href = blobUrl;
  link.download = name;

  // Append link to the body
  document.body.appendChild(link);

  // Dispatch click event on the link
  // This is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent('click', { 
      bubbles: true, 
      cancelable: true, 
      view: window 
    })
  );

  // Remove link from body
  document.body.removeChild(link);
}


function checkRightClick() {
  console.log("all good!")
}

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

String.prototype.zp = function() {
  // add an extra 0 to the beginning of the string
  if (this.length < 2) {
    return "0" + this;
  }
  return this;
}

Number.prototype.zp = function() {
  return this.toString().zp();
}

Array.prototype.insertAt = function(index, value) {
  this.splice(index, 0, value)
}

Array.prototype.last = function() {
  return this[this.length - 1]
}

Array.prototype.findTrack = function(t) {
  for (let i = 0; i < this.length; i++) {
    if (this[i].trackno == t) {
      return i
    }
  }
  return -1;
}

var CUETrack = function() {
  this.title = tr("untitled");
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
  this.wasModded = false;
  this.mode = "AUDIO"
}

var CUEReference = function() {
  this.filename = "";
  this.ext = "";
  this.position = 0;
  this.tracks = [];
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
  <h3>${tr("upload_here")}</h3>
  <br><br>
  <input id="cueOpen" type="file" style="border-style: solid; border-color: white;" accept=".cue">
  <br><br>
  <button class=med onclick="checkCUE()">${tr("ok")}</button>
  </div>
  `
}

function checkCUE() {
  if (!el('cueOpen').files[0]) {
    alert(tr("upload_error_nofile"));
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
  //console.log(c);
  //We don't need those spaces in our way!
  var processedCue = c.replaceAll("  ", "").split("\n")
  //console.log(processedCue)
  //Clear cueParts, just in case.
  cueParts = []
  theseTracks = [];
  var curcue = "placeholder";
  for (let i of processedCue) {
    if (i.includes("FILE \"")) {
      //If file prefix
      try {
        if (typeof curcue=="string") {
          throw "";
        }
        curcue.tracks = theseTracks;
      let cntr = 0;
      for (let i of curcue.tracks) {
        cntr++;
        i.trackno = cntr;
      }
      } catch(e) {console.log("nope")}
      //If this errors out, there's nothing to push.
      cueParts.push(curcue);
      curcue = new CUEReference();
      theseTracks = [];
      theseTracks.push(new CUETrack());
      curcue.filename = i.split('FILE "')[1].split('"')[0];
      curcue.ext = curcue.filename.split(".")[1]

    } else if (i.includes("TITLE ") && curcue != "placeholder" && !i.includes("FILE \"")) {
      //TITLE can be at the beginning of the file, but this is only for track names.

      theseTracks.last().title = i.split("TITLE \"")[1].split('"')[0];

    } else if (i.includes("TRACK ") && !i.includes("FILE \"")) {

      //Find track type

      //console.log("IMPORTANT! " + i.split("TRACK ")[1].split(" ")[1])

      //theseTracks.last().title = "test"
      //theseTracks.last().glint = "glorp"
      //console.log(theseTracks.last())

      theseTracks.last().trackno = parseInt(i.split("TRACK ")[1].split(" ")[0]);
      if (theseTracks.last().wasModded) {
        theseTracks.push(new CUETrack());
      } else {
        let mode = i.split("TRACK ")[1].split(" ")[1].split("\n").join("")
        theseTracks.last().mode = mode.substring(0, mode.length-1)
      }

    } else if (i.includes("INDEX ") && !i.includes("FILE \"") && !i.includes("TITLE \"")) {

      theseTracks.last().wasModded = true;
      var ino = parseInt(i.split("INDEX ")[1].split(" ")[0])
      switch (ino) {
        case 0:
          theseTracks.last().haspregap = true;
          var tm = i.split("INDEX ")[1].split(" ")[1].split(":");
          theseTracks.last().pregap = {mins: parseInt(tm[0]), secs: parseInt(tm[1]), frames: parseInt(tm[2])};
          break;
        case 1:
          var tm = i.split("INDEX ")[1].split(" ")[1].split(":");
          theseTracks.last().start = {mins: parseInt(tm[0]), secs: parseInt(tm[1]), frames: parseInt(tm[2])};
          break;
        default:
          console.log("This index doesn't matter")
      }

    } else {
      console.log([i, "Doesn't matter, skipping!"])
    }
  }
  curcue.tracks = theseTracks;
  cueParts.shift()
  cueParts.push(curcue)
  let cntr = 0;
  let pco = 0;
  for (let i of cueParts) {
    pco++;
    i.position = pco;
    for (let j of i.tracks) {
      cntr++;
      j.trackno = cntr;
    }
  }

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
  var blob = new Blob([createCueFile()], { type: 'application/x-cue' })
  var a = el("saveLink");
  a.download = "levelpack.cue";
  a.href = (window.webkitURL || window.URL).createObjectURL(blob);
  a.dataset.downloadurl = ['application/x-cue', a.download, a.href].join(':');


  //console.log("cueParts")

}

function toDoubleDigits(n) {
  if (n < 10) {
    return n.zp();
  }
  return n.toString();
}

function timestamp(obj) {
  return `${toDoubleDigits(obj.mins)}:${toDoubleDigits(obj.secs)}:${toDoubleDigits(obj.frames)}`
}

function createTs(m, s, f) {
  return {mins: m, secs: s, frames: f}
}

function createCueFile() {
  var cueStr = ""
  for (let i of cueParts) {
    var tempstr = "";
    tempstr += `FILE "${i.filename}" BINARY\n`
    for (let j of i.tracks) {
      tempstr += `\tTRACK ${toDoubleDigits(j.trackno)} ${j.mode}\n`
      tempstr += `\t\tTITLE "${j.title}"\n`
      if (j.haspregap) {
        tempstr += `\t\tINDEX 00 ${timestamp(j.pregap)}\n`
      }
      tempstr += `\t\tINDEX 01 ${timestamp(j.start)}\n`
    }
    cueStr += tempstr
  }
  return cueStr
}

function refreshList() {
  /*
  for (let i = 0; i < cueParts.length; i++) {
    cueParts[i].position = i + 1;
    for (let j = 0; j < cueParts[i].tracks.length; j++) {
      cueParts[i].tracks[j].trackno = j + 1;
    }
  }
  */
  /*
  let cntr = 0;
  let pco = 0;
  for (let i of cueParts) {
    pco++;
    i.position = pco;
    for (let j of i.tracks) {
      cntr++;
      j.trackno = cntr;
    }
  }*/
  debug_trackList = [];
  let cntr = 0; // counter
  let pco = 0; // position counter
  for (let i of cueParts) {
    pco++;
    i.position = pco;
  }
  for (let i of cueParts) {
    for (let j of i.tracks) {
      cntr++;
      j.trackno = cntr;
      debug_trackList.push(j);
    }
  }
}

function moveUpFile(t) {
  saveNames()
  // Highlight song element for navigation
  var l = cueParts.length - 1;
  var stopped = false;
  if (t == 1) {
    [cueParts[l], cueParts[0]] = [cueParts[0], cueParts[l]]
    stopped = true;
  } else {
    [cueParts[t-2], cueParts[t-1]] = [cueParts[t-1], cueParts[t-2]]
  }
  refreshList();
  renderCue();
  if (!stopped) {
    window.location.href = baseUrl + "#song" + (t - 1)
  }
}

function moveUp(loc) {
  saveNames();
  loc = loc.split("~");
  loc = [parseInt(loc[0]), parseInt(loc[1])]
}

function moveDownFile(t) {
  saveNames()
  var l = cueParts.length - 1;
  var stopped = false;
  if (t == l+1) {
    [cueParts[0], cueParts[l]] = [cueParts[l], cueParts[0]]
    stopped = true;
  } else {
    [cueParts[t-1], cueParts[t]] = [cueParts[t], cueParts[t-1]]
  }
  refreshList();
  renderCue();
  if (!stopped) {
    window.location.href = baseUrl + "#song" + (t + 1)
  }
}

function dupeFile(t) {
  saveNames()
  thing = JSON.parse(JSON.stringify(cueParts[t-1]));
  //console.log(thing)
  //For some reason, when I duplicated just the object, it changed the original one.
  //Found the reason, it was referencing the original object!
  newone = new CUEReference();
  newone.position = t+1
  newone.filename = thing.filename;
  newone.ext = thing.ext;
  newone.tracks = thing.tracks;
  cueParts.insertAt(t, newone)
  refreshList();
  renderCue();
}

function delFile(t) {
  saveNames()
  cueParts.splice(t-1, 1);
  refreshList();
  renderCue();
}

function addSong(file) {
  saveNames();
  let song = new CUETrack();
  song.wasModded = true;
  cueParts[file-1].tracks.push(song);
  refreshList();
  renderCue();
}

function saveNames() {
  for (let fileNo = 1; fileNo <= cueParts.length; fileNo++) {
    let currentFile = cueParts[fileNo-1];

    // not using the variable I just declared because I am writing to it
    cueParts[fileNo-1].filename = el("title" + fileNo).value

    if (currentFile.tracks.length == 0) {
      continue;
    }

    //console.log([cueParts[i-1].tracks[0].trackno, cueParts[i-1].tracks.last().trackno])
    // j is the track number of the current file
    for (let j = currentFile.tracks[0].trackno; j <=currentFile.tracks.last().trackno; j++) {
      //console.log(el("titleSong" + `${i}~${j}`).value + `, ${i}~${j}`)
      for (let track of currentFile.tracks) {
        //track is an unsaved CUE track.
        track.title = el("titleSong" + `${fileNo}~${track.trackno}`).value
        track.mode = el("trackType" + `${fileNo}~${track.trackno}`).value
        track.start = createTs(
          el("startM" + `${fileNo}~${track.trackno}`).value,
          el("startS" + `${fileNo}~${track.trackno}`).value,
          el("startF" + `${fileNo}~${track.trackno}`).value)

        track.pregap = createTs(
          el("pregapM" + `${fileNo}~${track.trackno}`).value,
          el("pregapS" + `${fileNo}~${track.trackno}`).value,
          el("pregapF" + `${fileNo}~${track.trackno}`).value)
        track.haspregap = (track.pregap == {mins: 0, secs: 0, frames: 0})
      }

    }
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

function organize() {
  saveNames()
  console.log("Saved!")
  refreshList();
  renderCue();
}

function addFile(name) {
  /*name = "New track.wav"*/
  if (!name) {
    name = tr("new_track") + ".wav"
  }
  saveNames()
  var s = new CUEReference();
  s.filename = name;
  s.position = cueParts.length;
  s.tracks = [new CUETrack()];
  s.tracks.last().trackno = 1;
  s.tracks.last().wasModded = true;
  cueParts.push(s);
  refreshList();
  renderCue();
}

function handleDrop(evt) {
  if (isEditor) {
    var f = evt.dataTransfer.files
    for (let i of f) {
      addFile(i.name)
    }
  }
  pd(evt)
}

function createCue() {
  cueParts = [];
  var s = new CUEReference();
  s.filename = tr("new_track") + ".wav";
  s.position = 1;
  s.tracks = [new CUETrack()];
  s.tracks.last().trackno = 1;
  s.tracks.last().wasModded = true;
  cueParts.push(s);
  isEditor = true;
  refreshList();
  renderCue();

}

function moveUp(song) {
  saveNames();
  var pos = song.split("~");
  pos = [parseInt(pos[0]), parseInt(pos[1])];
  var tempTracks = cueParts[pos[0]-1].tracks;
  var tpos = tempTracks.findTrack(pos[1]);
  if (tpos == 0) {
    [tempTracks[0], tempTracks[tempTracks.length - 1]] = [tempTracks[tempTracks.length - 1], tempTracks[0]]
  } else {
    [tempTracks[tpos-1], tempTracks[tpos]] = [tempTracks[tpos], tempTracks[tpos-1]]
  }
  cueParts[pos[0]-1].tracks = tempTracks;
  refreshList();
  renderCue();
}

function moveDown(song) {
  saveNames();
  var pos = song.split("~");
  pos = [parseInt(pos[0]), parseInt(pos[1])];
  var tempTracks = cueParts[pos[0]-1].tracks;
  var tpos = tempTracks.findTrack(pos[1]);
  if (tpos == tempTracks.length - 1) {
    [tempTracks[tempTracks.length - 1], tempTracks[0]] = [tempTracks[0], tempTracks[tempTracks.length - 1]];
  } else {
    [tempTracks[tpos], tempTracks[tpos+1]] = [tempTracks[tpos+1], tempTracks[tpos]]
  }
  cueParts[pos[0]-1].tracks = tempTracks;
  refreshList();
  renderCue();
}

function dupe(song) {
  saveNames();
  var pos = song.split("~");
  pos = [parseInt(pos[0]), parseInt(pos[1])];
  var tempTracks = cueParts[pos[0]-1].tracks;
  var tempSong = tempTracks[tempTracks.findTrack(pos[1])];
  var newCue = new CUETrack();
  for (let i in tempSong) {
    newCue[i] = tempSong[i];
  }
  tempTracks.push(newCue);
  cueParts[pos[0]-1].tracks = tempTracks;
  refreshList();
  renderCue();
}

function delSong(song) {
  saveNames();
  var pos = song.split("~");
  pos = [parseInt(pos[0]), parseInt(pos[1])];
  var tempTracks = cueParts[pos[0]-1].tracks;
  var tpos = tempTracks.findTrack(pos[1]);
  tempTracks.splice(tpos,1);
  cueParts[pos[0]-1].tracks = tempTracks;
  refreshList();
  renderCue();
}

function cueTrackToHTML(cueObj, cueParent) {
  return `
  <div id="song${cueParent.position}~${cueObj.trackno}" class="song setTrack">
  <input value=${cueObj.trackno} disabled class=trackNumber style="width: 60px; font-size: 30px; border: none;">
  <input class="nameInput" id="titleSong${cueParent.position}~${cueObj.trackno}" value="${cueObj.title}" type="text" style="" onkeydown="handleKeyPress(event)">
  <div class="itemblock">
  <img src="upArrow.png" width="30" height="30" onclick="moveUp('${cueParent.position}~${cueObj.trackno}')">
  <img src="downArrow.png" width="30" height="30" onclick="moveDown('${cueParent.position}~${cueObj.trackno}')">
  <img src="dupe.png" width="30" height="30" onclick="dupe('${cueParent.position}~${cueObj.trackno}')">
  <img src="delete.png" width="30" height="30" onclick="delSong('${cueParent.position}~${cueObj.trackno}')">
  </div>
  <br>
  <span class=label>${tr("start")}: </span>
  <div class="timestamp">
  <input id="startM${cueParent.position}~${cueObj.trackno}" value=${cueObj.start.mins.zp()} class="label timer" type="number" min=0 onchange="organize()">
  <span class=label>:</span>
  <input id="startS${cueParent.position}~${cueObj.trackno}" value=${cueObj.start.secs.zp()} class="label timer" type="number" min=0 max=60 onchange="organize()">
  <span class=label>:</span>
  <input id="startF${cueParent.position}~${cueObj.trackno}" value=${cueObj.start.frames.zp()} class="label timer" type="number" min=0 max=75 onchange="organize()">
  </div>
  <br>
  <span class=label>${tr("pregap")}: </span>
  <div class="timestamp">
  <input id="pregapM${cueParent.position}~${cueObj.trackno}" value=${cueObj.pregap.mins.zp()} class="label timer" type="number" min=0 onchange="organize()">
  <span class=label>:</span>
  <input id="pregapS${cueParent.position}~${cueObj.trackno}" value=${cueObj.pregap.secs.zp()} class="label timer" type="number" min=0 max=60 onchange="organize()">
  <span class=label>:</span>
  <input id="pregapF${cueParent.position}~${cueObj.trackno}" value=${cueObj.pregap.frames.zp()} class="label timer" type="number" min=0 max=75 onchange="organize()">
  </div>
  <br>
  <span class=label>${tr("track_type")}: </span>
  <select id="trackType${cueParent.position}~${cueObj.trackno}" onchange="organize()">
  <option value="AUDIO" ${cueObj.mode == "AUDIO"? "selected" : ""}>${tr("type_audio")}</option>

  <optgroup label="MODE1">
  <option value="MODE1/2048" ${cueObj.mode == "MODE1/2048" ? "selected" : ""}>${tr("type_data")} (MODE1/2048)</option>
  <option value="MODE1/2352" ${cueObj.mode == "MODE1/2352" ? "selected" : ""}>${tr("type_data")} (MODE1/2352)</option>
  </optgroup>

  <optgroup label="MODE2">
  <option value="MODE2/2048" ${cueObj.mode == "MODE2/2048" ? "selected" : ""}>${tr("type_data")} (MODE2/2048)</option>
  <option value="MODE2/2324" ${cueObj.mode == "MODE2/2324" ? "selected" : ""}>${tr("type_data")} (MODE2/2324)</option>
  <option value="MODE2/2336" ${cueObj.mode == "MODE2/2336" ? "selected" : ""}>${tr("type_data")} (MODE2/2336)</option>
  <option value="MODE2/2352" ${cueObj.mode == "MODE2/2352" ? "selected" : ""}>${tr("type_data")} (MODE2/2352)</option>
  </optgroup>

  <option value="CDG" ${cueObj.mode == "CDG" ? "selected" : ""}>${tr("type_cdg")}</option>

  <optgroup label="CDI">
  <option value="CDI/2336" ${cueObj.mode == "CDI/2336" ? "selected" : ""}>${tr("type_cdi")} (CDI/2336)</option>
  <option value="CDI/2352" ${cueObj.mode == "CDI/2352" ? "selected" : ""}>${tr("type_cdi")} (CDI/2352)</option>
  </optgroup>
  </select>
  </div>
  `;
}

function cueToHTML(cueParent) {
  let html = `
  <div id="song${cueParent.position}" class="song file">
  <input value=${cueParent.position} class=trackNumber disabled style="width: 60px; font-size: 30px; border: none;">
  <input class="nameInput" id="title${cueParent.position}" value="${cueParent.filename}" type="text" style="" onkeydown="handleKeyPress(event)">
  <div class="itemblock">
  <img src="upArrow.png" width="30" height="30" onclick="moveUpFile(${cueParent.position})">
  <img src="downArrow.png" width="30" height="30" onclick="moveDownFile(${cueParent.position})">
  <img src="dupe.png" width="30" height="30" onclick="dupeFile(${cueParent.position})">
  <img src="delete.png" width="30" height="30" onclick="delFile(${cueParent.position})">
  <img src="add.png" width="30" height="30" onclick="addSong(${cueParent.position})">
  </div>
  </div>
  `
  for (let cueObj of cueParent.tracks) {
    html += cueTrackToHTML(cueObj, cueParent);
  }
  return html;
}

function help() {
  var a = document.createElement("a");
  a.href = tr("help_page");
  a.click()
}

function setLanguage() {
  var lang_dropdown = el("language");
  lang = lang_dropdown.value;
  localStorage.setItem("language", lang);
  alert(tr("save_and_reload"))
}
