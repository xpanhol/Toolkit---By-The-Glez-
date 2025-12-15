// Initialize Namespace
$._TheGlez = $._TheGlez || {};

// Polyfill JSON if needed (for older AE versions, though usually present in CEP context)
if (typeof JSON !== 'object') {
    JSON = {};
}
if (!JSON.parse) {
    // Basic unsafe parse if native JSON is missing (fallback)
    JSON.parse = function(s) { return eval('(' + s + ')'); };
}

// Helper: Parse incoming JSON args
function getArgs(jsonStr) {
    try {
        return JSON.parse(jsonStr);
    } catch(e) {
        return {};
    }
}

// --- SUBTITLE PRO ---
// Opens file dialog and returns content + name to React
$._TheGlez.getSrtFileContent = function() {
    var f = File.openDialog("Select SRT File", "*.srt");
    if (f) {
        f.open("r");
        var content = f.read();
        f.close();
        // Return JSON with name and content
        return JSON.stringify({
            name: f.name,
            content: content
        });
    }
    return "";
}

$._TheGlez.runSubtitleProLogic = function(argsStr) {
    var args = getArgs(argsStr); 
    // args: { srtContent: string, config: { size, color: [r,g,b], y, caps, stroke, wrap, anim } }
    
    if (!args.srtContent) { alert("No content provided."); return; }

    function parseTime(str) { var parts = str.replace(',', '.').split(':'); if (parts.length < 3) return 0; return (parseInt(parts[0])*3600) + (parseInt(parts[1])*60) + parseFloat(parts[2]); }

    app.beginUndoGroup("Subtitle Pro Gen");
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) comp = app.project.items.addComp("Subtitles Sequence", 1080, 1920, 1, 60, 30);
        
        var cfg = args.config;
        
        // Normalize line breaks
        var blocks = args.srtContent.replace(/\r\n/g, "\n").split("\n\n");
        var wrapText = function(text, limit) { var words = text.split(" "); var lines = [], cur = ""; for (var i=0; i<words.length; i++) { if ((cur + words[i]).length > limit) { if(cur.length>0) lines.push(cur); cur = words[i] + " "; } else cur += words[i] + " "; } if(cur.length>0) lines.push(cur); return lines.join("\r"); };
        
        for (var i=0; i<blocks.length; i++) {
            var lines = blocks[i].split("\n");
            if (lines.length >= 3) {
                var timePart = lines[1].split(" --> ");
                if (timePart.length === 2) {
                    var rawTxt = lines.slice(2).join(" "); 
                    if (cfg.caps) rawTxt = rawTxt.toUpperCase(); 
                    var finalTxt = wrapText(rawTxt, cfg.wrap);
                    
                    var l = comp.layers.addText(finalTxt); 
                    var doc = l.property("Source Text").value;
                    doc.fontSize = cfg.size; 
                    doc.fillColor = cfg.color; 
                    doc.justification = ParagraphJustification.CENTER_JUSTIFY;
                    
                    if (cfg.stroke) { doc.applyStroke = true; doc.strokeColor = [0,0,0]; doc.strokeWidth = 10; }
                    
                    l.property("Source Text").setValue(doc); 
                    // Y position is relative to comp height %
                    var yPos = comp.height * (cfg.y / 100);
                    l.property("Position").setValue([comp.width/2, yPos]);
                    
                    l.inPoint = parseTime(timePart[0]); 
                    l.outPoint = parseTime(timePart[1]);
                    var st = l.inPoint;

                    if (cfg.anim === "Pop Up") { 
                        l.property("Scale").setValueAtTime(st, [0,0]); 
                        l.property("Scale").setValueAtTime(st+0.15, [110,110]); 
                        l.property("Scale").setValueAtTime(st+0.25, [100,100]); 
                    } else if (cfg.anim === "Fade In") { 
                        l.property("Opacity").setValueAtTime(st, 0); 
                        l.property("Opacity").setValueAtTime(st+0.3, 100); 
                    } else if (cfg.anim === "Slide Up") { 
                        var p = l.property("Position").value; 
                        l.property("Position").setValueAtTime(st, [p[0], p[1]+100]); 
                        l.property("Position").setValueAtTime(st+0.3, p); 
                        l.property("Opacity").setValueAtTime(st, 0); 
                        l.property("Opacity").setValueAtTime(st+0.3, 100); 
                    } else if (cfg.anim === "Typewriter") { 
                        var anim = l.Text.Animators.addProperty("ADBE Text Animator"); 
                        var op = anim.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity"); 
                        op.setValue(0); 
                        var sel = anim.property("ADBE Text Selectors").addProperty("ADBE Text Selector"); 
                        sel.property("Start").setValueAtTime(st, 0); 
                        sel.property("Start").setValueAtTime(st + (finalTxt.length * 0.05), 100); 
                    }
                }
            }
        }
    } catch(e) { alert("Error: " + e.toString()); } 
    finally { app.endUndoGroup(); }
}


// --- RESIZE COMP ---
$._TheGlez.runResizeComp = function() {
    if (!app || !app.project) { alert("No project open."); return; }
    var proj = app.project; var comp = proj.activeItem;
    if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }
    if (!comp.selectedLayers || comp.selectedLayers.length !== 1) { alert("Select ONE layer."); return; }
    var layer = comp.selectedLayers[0];
    if (layer.threeDLayer) { alert("Works best with 2D layers."); return; }
    
    function getBounds2D(lyr, time) {
        var rect; try { rect = lyr.sourceRectAtTime(time, false); } catch (e) { rect = null; }
        if (!rect) { var w = lyr.width || 0; var h = lyr.height || 0; rect = { left: 0, top: 0, width: w, height: h }; }
        var pos = lyr.property("Position").value; var anchor = lyr.property("Anchor Point").value; var scale = lyr.property("Scale").value;
        var sx = scale[0] / 100.0; var sy = scale[1] / 100.0;
        var compLeft = pos[0] + (rect.left - anchor[0]) * sx; var compTop = pos[1] + (rect.top - anchor[1]) * sy;
        return { minX: compLeft, maxX: compLeft + (rect.width * sx), minY: compTop, maxY: compTop + (rect.height * sy) };
    }
    var bounds = getBounds2D(layer, comp.time);
    var newWidth = Math.round(bounds.maxX - bounds.minX); var newHeight = Math.round(bounds.maxY - bounds.minY);
    if (newWidth < 1 || newHeight < 1) { alert("Layer too small."); return; }
    
    app.beginUndoGroup("Resize Comp - The Glez");
    var offsetX = bounds.minX; var offsetY = bounds.minY;
    for (var i = 1; i <= comp.numLayers; i++) {
        var lyr = comp.layer(i); var posProp = lyr.property("Position");
        if (posProp) { var pos = posProp.value; if (pos instanceof Array && pos.length >= 2) { pos[0] -= offsetX; pos[1] -= offsetY; posProp.setValue(pos); } }
    }
    comp.width = newWidth; comp.height = newHeight;
    app.endUndoGroup();
}


// --- UNUSED CLEANER ---
$._TheGlez.runUnusedCleanerLogic = function(argsStr) {
    var args = getArgs(argsStr);
    // args: { precomps: bool, footage: bool, method: "move" | "delete" }

    if (!app || !app.project) return;
    var proj = app.project; 
    var usedMap = {};
    for (var c = 1; c <= proj.numItems; c++) { var it = proj.item(c); if(it instanceof CompItem){ for(var l=1; l<=it.numLayers; l++){ try{var s=it.layer(l).source; if(s) usedMap[s.id]=true;}catch(e){} } } }
    
    function getOrCreateFolder(name, parent) { if(!parent) parent=proj.rootFolder; for(var i=1; i<=proj.numItems; i++){ var x=proj.item(i); if(x instanceof FolderItem && x.parentFolder===parent && x.name===name) return x;} var n=proj.items.addFolder(name); n.parentFolder=parent; return n; }
    
    app.beginUndoGroup("Clean Unused");
    var unusedFolder = (args.method === "move") ? getOrCreateFolder("_Unused", getOrCreateFolder("04 - Others")) : null;
    var count = 0;
    var items = []; for(var i=1; i<=proj.numItems; i++) items.push(proj.item(i));
    
    for(var j=0; j<items.length; j++){
        var item=items[j]; if(item instanceof FolderItem) continue;
        var isUsed = !!usedMap[item.id];
        var process = false;
        
        if(args.precomps && item instanceof CompItem && !isUsed && item.parentFolder !== proj.rootFolder) process=true;
        if(args.footage && !(item instanceof CompItem) && !isUsed) process=true;
        
        if(process){
            if(args.method === "move") item.parentFolder = unusedFolder;
            else try{item.remove();}catch(e){}
            count++;
        }
    }
    app.endUndoGroup();
    return "Processed " + count + " items.";
}


// --- RENAMER ---
$._TheGlez.runRenamerLogic = function(argsStr) {
    var args = getArgs(argsStr);
    // args: { prefix, base, suffix, numbering }

    if (!app || !app.project) return;
    var comp = app.project.activeItem; 
    if (!comp || !comp.selectedLayers || comp.selectedLayers.length === 0) { alert("Select layers."); return; }

    app.beginUndoGroup("Renamer");
    var layers = comp.selectedLayers;
    var sorted = []; for(var i=0; i<layers.length; i++) sorted.push(layers[i]);
    sorted.sort(function(a,b){ return a.index - b.index; });
    
    for(var i=0; i<sorted.length; i++){
        var name = ""; 
        if(args.prefix) name += args.prefix; 
        if(args.base) name += args.base;
        if(args.numbering) { var n = (i+1).toString(); while(n.length<2) n="0"+n; name += n; }
        if(args.suffix) name += args.suffix;
        if(name !== "") sorted[i].name = name;
    }
    app.endUndoGroup();
}


// --- ORGANIZER ---
$._TheGlez.getProjectComps = function() {
    if (!app || !app.project) return "[]";
    var comps = [];
    for (var i=1; i <= app.project.numItems; i++) {
        if (app.project.item(i) instanceof CompItem) {
            comps.push({id: app.project.item(i).id, name: app.project.item(i).name});
        }
    }
    return JSON.stringify(comps);
}

$._TheGlez.runOrganizerLogic = function(argsStr) {
    var args = getArgs(argsStr);
    // args: { preset: 0|1, keepFolders: bool, useMaster: bool, masterCompId: int }

    if (!app || !app.project) return;

    var proj = app.project;
    var rootFolder = proj.rootFolder;

    var masterComp = null;
    if (args.useMaster && args.masterCompId) {
        masterComp = proj.itemByID(args.masterCompId);
    }
    var presetAdvanced = (args.preset === 1); // 0=basic, 1=advanced

    app.beginUndoGroup("Organize project - The Glez");

    function getOrCreateFolder(name, parentFolder) {
        if (!parentFolder) parentFolder = rootFolder;
        for (var i = 1; i <= proj.numItems; i++) {
            var it = proj.item(i);
            if (it instanceof FolderItem && it.parentFolder === parentFolder && it.name === name) return it;
        }
        var newFolder = proj.items.addFolder(name);
        newFolder.parentFolder = parentFolder;
        return newFolder;
    }

    var masterCompFolder = masterComp ? getOrCreateFolder("01 - Master Comp (Output)", rootFolder) : null;
    var preCompsFolder = getOrCreateFolder("02 - Pre-Comps", rootFolder);
    var footageRoot    = getOrCreateFolder("03 - Footage",   rootFolder);

    var imagesFolder   = getOrCreateFolder("3.1 - Images (Stills)", footageRoot);
    var videosFolder   = getOrCreateFolder("3.2 - Video",           footageRoot);
    var audioFolder    = getOrCreateFolder("3.3 - Audio",           footageRoot);
    var miscFootage    = getOrCreateFolder("3.4 - Misc",            footageRoot);
    var imgSeqFolder   = presetAdvanced ? getOrCreateFolder("3.5 - Image Sequences", footageRoot) : null;
    var othersRoot     = getOrCreateFolder("04 - Others", rootFolder);
    var rendersRoot    = presetAdvanced ? getOrCreateFolder("05 - Renders", rootFolder) : null;

    var specialFolders = [preCompsFolder, footageRoot, imagesFolder, videosFolder, audioFolder, miscFootage, othersRoot];
    if (masterCompFolder) specialFolders.push(masterCompFolder);
    if (imgSeqFolder) specialFolders.push(imgSeqFolder);
    if (rendersRoot) specialFolders.push(rendersRoot);

    function isSpecialFolder(item) {
        for (var i = 0; i < specialFolders.length; i++) if (item === specialFolders[i]) return true;
        return false;
    }

    // Helper extensions
    var imageExts = { "jpg":1, "jpeg":1, "png":1, "tif":1, "tiff":1, "psd":1, "exr":1, "hdr":1, "tga":1, "bmp":1, "gif":1, "dpx":1, "cin":1, "webp":1 };
    var videoExts = { "mov":1, "mp4":1, "m4v":1, "avi":1, "mxf":1, "mkv":1, "mts":1, "m2ts":1, "wmv":1, "flv":1, "mpeg":1, "mpg":1 };
    var audioExts = { "wav":1, "aif":1, "aiff":1, "mp3":1, "m4a":1, "ogg":1 };
    function getExtensionFromName(name) { var dot = name.lastIndexOf("."); return (dot < 0) ? "" : name.substring(dot+1).toLowerCase(); }
    function isImageSequenceName(name) { var m = name.substring(0, name.lastIndexOf(".")).match(/(\d{3,6})$/); return m !== null; }

    var items = []; for (var i = 1; i <= proj.numItems; i++) items.push(proj.item(i));

    for (var j = 0; j < items.length; j++) {
        var item = items[j];
        if (isSpecialFolder(item)) continue;
        if (args.keepFolders && item.parentFolder !== rootFolder) continue;
        if (masterComp && item === masterComp) { item.parentFolder = masterCompFolder; continue; }
        if (item instanceof FolderItem) continue;

        if (item instanceof CompItem) { item.parentFolder = preCompsFolder; continue; }

        var ext = getExtensionFromName(item.name);
        if (audioExts[ext]) { item.parentFolder = audioFolder; continue; }
        if (imageExts[ext]) {
            if (presetAdvanced && imgSeqFolder && isImageSequenceName(item.name)) item.parentFolder = imgSeqFolder;
            else item.parentFolder = imagesFolder;
            continue;
        }
        if (videoExts[ext]) { item.parentFolder = videosFolder; continue; }
        
        if (ext === "") item.parentFolder = othersRoot;
        else item.parentFolder = miscFootage;
    }

    app.endUndoGroup();
}


// --- AUTO COLOR ---
$._TheGlez.runAutoColorLogic = function(argsStr) {
    var args = getArgs(argsStr);
    // args: { labels: { camera: int, light: int ... }, addPrefix: bool }
    
    if (!app || !app.project) return;
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem) || !comp.selectedLayers || comp.selectedLayers.length === 0) {
        alert("Select layers in a composition."); return;
    }

    var selLayers = comp.selectedLayers;
    var prefixMap = { camera:"CAM - ", light:"LGT - ", audio:"AUD - ", precomp:"PC - ", footVideo:"VID - ", footStill:"IMG - ", text:"TXT - ", shape:"SHP - ", "null":"NULL - ", adjust:"ADJ - ", other:"OTH - " };

    app.beginUndoGroup("Auto Color - The Glez");

    for (var k = 0; k < selLayers.length; k++) {
        var lyr = selLayers[k];
        var category = "other";

        // Logic to determine type
        if (lyr instanceof CameraLayer) category = "camera";
        else if (lyr instanceof LightLayer) category = "light";
        else if (lyr.hasAudio && !lyr.hasVideo) category = "audio";
        else if (lyr.property("Source Text")) category = "text";
        else if (lyr.property("ADBE Root Vectors Group")) category = "shape";
        else if (lyr.nullLayer) category = "null";
        else if (lyr.adjustmentLayer) category = "adjust";
        else if (lyr.source instanceof CompItem) category = "precomp";
        else if (lyr.source) {
             // quick footage check
             var name = lyr.source.name.toLowerCase();
             var ext = name.substring(name.lastIndexOf(".")+1);
             var vidExts = ["mov","mp4","avi","mxf","mkv"];
             if (vidExts.indexOf(ext) > -1) category = "footVideo";
             else category = "footStill"; // assume still
        }

        // Apply
        var lbl = args.labels[category];
        if (lbl && lbl > 0) lyr.label = lbl;

        if (args.addPrefix) {
            var p = prefixMap[category];
            if (p && lyr.name.indexOf(p) !== 0) lyr.name = p + lyr.name;
        }
    }
    app.endUndoGroup();
}