// Initialize Namespace
$._TheGlez = $._TheGlez || {};

// --- SUBTITLE PRO ---
$._TheGlez.runSubtitlePro = function() {
    (function(thisObj) {
        var scriptName = "Subtitle Pro";
        function rgbToHex(r, g, b) { var toHex = function(c) { var hex = Math.round(c * 255).toString(16); return hex.length == 1 ? "0" + hex : hex; }; return toHex(r) + toHex(g) + toHex(b); }
        function hexToRgb(hex) { if (typeof hex !== 'string') return [1,1,1]; hex = hex.replace(/[^0-9A-Fa-f]/g, ""); if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]; if (hex.length !== 6) return [1,1,1]; var r = parseInt(hex.substring(0,2), 16) / 255; var g = parseInt(hex.substring(2,4), 16) / 255; var b = parseInt(hex.substring(4,6), 16) / 255; return [r, g, b]; }
        function parseTime(str) { var parts = str.replace(',', '.').split(':'); if (parts.length < 3) return 0; return (parseInt(parts[0])*3600) + (parseInt(parts[1])*60) + parseFloat(parts[2]); }

        function buildUI(thisObj) {
            var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", scriptName, undefined, {resizeable: true});
            win.orientation = "column"; win.alignChildren = ["fill", "top"]; win.spacing = 10; win.margins = 16;
            
            var headerGrp = win.add("group"); headerGrp.orientation = "row";
            var title = headerGrp.add("statictext", undefined, "SUBTITLE PRO");
            title.graphics.font = ScriptUI.newFont("Verdana", "BOLD", 18);

            var pnlFile = win.add("panel", undefined, "SRT File"); pnlFile.orientation = "column"; pnlFile.alignChildren = ["fill", "top"]; pnlFile.margins = 12;
            var grpFileRow = pnlFile.add("group"); grpFileRow.orientation = "row";
            var btnLoad = grpFileRow.add("button", undefined, "Import .SRT"); btnLoad.size = [120, 30];
            var lblFile = grpFileRow.add("statictext", undefined, "No file...", {truncate: "middle"}); lblFile.size = [150, 20];

            var pnlStyle = win.add("panel", undefined, "Style"); pnlStyle.orientation = "column"; pnlStyle.alignChildren = ["fill", "top"]; pnlStyle.spacing = 10; pnlStyle.margins = 12;
            var grpColor = pnlStyle.add("group"); grpColor.orientation = "row"; grpColor.add("statictext", undefined, "Color:");
            var colorBtn = grpColor.add("button", [0,0,30,25], ""); var currentColor = [1, 1, 1];
            var inpHex = grpColor.add("edittext", undefined, "FFFFFF"); inpHex.characters = 6;
            var drawSwatch = function() { colorBtn.onDraw = function() { var g = this.graphics; g.rectPath(0,0,this.size[0],this.size[1]); g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, currentColor)); g.strokePath(g.newPen(g.PenType.SOLID_COLOR, [0,0,0], 1)); }; colorBtn.notify("onDraw"); }; drawSwatch();
            
            colorBtn.onClick = function() { var r = Math.round(currentColor[0] * 255); var g = Math.round(currentColor[1] * 255); var b = Math.round(currentColor[2] * 255); var colorInt = (r << 16) | (g << 8) | b; var result = $.colorPicker(colorInt); if (result !== -1) { var nr = ((result >> 16) & 0xFF) / 255; var ng = ((result >> 8) & 0xFF) / 255; var nb = (result & 0xFF) / 255; currentColor = [nr, ng, nb]; drawSwatch(); inpHex.text = rgbToHex(nr, ng, nb).toUpperCase(); } };
            inpHex.onChange = function() { currentColor = hexToRgb(this.text); drawSwatch(); };

            var grpTypo = pnlStyle.add("group"); grpTypo.orientation = "row";
            grpTypo.add("statictext", undefined, "Size:"); var inpSize = grpTypo.add("edittext", undefined, "30"); inpSize.characters = 4;
            grpTypo.add("statictext", undefined, "Break:"); var inpBreak = grpTypo.add("edittext", undefined, "50"); inpBreak.characters = 4;

            var grpChecks = pnlStyle.add("group"); grpChecks.orientation = "row";
            var chkCaps = grpChecks.add("checkbox", undefined, "UPPERCASE");
            var chkStroke = grpChecks.add("checkbox", undefined, "Stroke");

            var pnlAnim = win.add("panel", undefined, "Animation"); pnlAnim.orientation = "column"; pnlAnim.alignChildren = ["fill", "top"];
            var grpAnim = pnlAnim.add("group"); grpAnim.orientation = "row"; grpAnim.add("statictext", undefined, "Preset:");
            var ddAnim = grpAnim.add("dropdownlist", undefined, ["Pop Up", "Fade In", "Slide Up", "Typewriter"]); ddAnim.selection = 0;
            var grpPos = pnlAnim.add("group"); grpPos.add("statictext", undefined, "Position Y:");
            var sldPos = grpPos.add("slider", undefined, 92, 0, 100);

            var btnRun = win.add("button", undefined, "GENERATE SUBTITLES"); btnRun.size = [undefined, 45];
            
            var srtContent = "";
            btnLoad.onClick = function() { var f = File.openDialog("Select SRT File"); if (f) { f.open("r"); srtContent = f.read(); f.close(); lblFile.text = f.name; } };

            btnRun.onClick = function() {
                if (!srtContent) { alert("Import an SRT file first."); return; }
                app.beginUndoGroup("Subtitle Pro Gen");
                try {
                    var comp = app.project.activeItem;
                    if (!comp || !(comp instanceof CompItem)) comp = app.project.items.addComp("Subtitles Sequence", 1080, 1920, 1, 60, 30);
                    var config = { size: parseInt(inpSize.text), color: currentColor, y: comp.height * (sldPos.value / 100), caps: chkCaps.value, stroke: chkStroke.value, wrap: parseInt(inpBreak.text), anim: ddAnim.selection ? ddAnim.selection.text : "Pop Up" };
                    var blocks = srtContent.replace(/\r\n/g, "\n").split("\n\n");
                    var wrapText = function(text, limit) { var words = text.split(" "); var lines = [], cur = ""; for (var i=0; i<words.length; i++) { if ((cur + words[i]).length > limit) { if(cur.length>0) lines.push(cur); cur = words[i] + " "; } else cur += words[i] + " "; } if(cur.length>0) lines.push(cur); return lines.join("\r"); };
                    
                    for (var i=0; i<blocks.length; i++) {
                        var lines = blocks[i].split("\n");
                        if (lines.length >= 3) {
                            var timePart = lines[1].split(" --> ");
                            if (timePart.length === 2) {
                                var rawTxt = lines.slice(2).join(" "); if (config.caps) rawTxt = rawTxt.toUpperCase(); var finalTxt = wrapText(rawTxt, config.wrap);
                                var l = comp.layers.addText(finalTxt); var doc = l.property("Source Text").value;
                                doc.fontSize = config.size; doc.fillColor = config.color; doc.justification = ParagraphJustification.CENTER_JUSTIFY;
                                if (config.stroke) { doc.applyStroke = true; doc.strokeColor = [0,0,0]; doc.strokeWidth = 10; }
                                l.property("Source Text").setValue(doc); l.property("Position").setValue([comp.width/2, config.y]);
                                l.inPoint = parseTime(timePart[0]); l.outPoint = parseTime(timePart[1]);
                                var st = l.inPoint;
                                if (config.anim === "Pop Up") { l.property("Scale").setValueAtTime(st, [0,0]); l.property("Scale").setValueAtTime(st+0.15, [110,110]); l.property("Scale").setValueAtTime(st+0.25, [100,100]); }
                                else if (config.anim === "Fade In") { l.property("Opacity").setValueAtTime(st, 0); l.property("Opacity").setValueAtTime(st+0.3, 100); }
                                else if (config.anim === "Slide Up") { var p = l.property("Position").value; l.property("Position").setValueAtTime(st, [p[0], p[1]+100]); l.property("Position").setValueAtTime(st+0.3, p); l.property("Opacity").setValueAtTime(st, 0); l.property("Opacity").setValueAtTime(st+0.3, 100); }
                                else if (config.anim === "Typewriter") { var anim = l.Text.Animators.addProperty("ADBE Text Animator"); var op = anim.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity"); op.setValue(0); var sel = anim.property("ADBE Text Selectors").addProperty("ADBE Text Selector"); sel.property("Start").setValueAtTime(st, 0); sel.property("Start").setValueAtTime(st + (finalTxt.length * 0.05), 100); }
                            }
                        }
                    }
                } catch(e) { alert("Error: " + e.toString()); } finally { app.endUndoGroup(); }
            };
            win.layout.layout(true); return win;
        }
        var myWin = buildUI(thisObj);
        if ((myWin instanceof Window) && (myWin.type !== 'palette')) { myWin.center(); myWin.show(); }
    })(null);
}

// --- RESIZE COMP ---
$._TheGlez.runResizeComp = function() {
    (function () {
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
    })();
}

// --- UNUSED CLEANER ---
$._TheGlez.runUnusedCleaner = function() {
    (function () {
        if (!app || !app.project) return;
        var dlg = new Window("dialog", "Unused Cleaner"); dlg.orientation = "column"; dlg.alignChildren = "left"; dlg.margins = 12;
        dlg.add("statictext", undefined, "Plug-in By The Glez");
        var grpWhat = dlg.add("panel", undefined, "Targets"); grpWhat.orientation = "column"; grpWhat.alignChildren = "left";
        var chkPrecomps = grpWhat.add("checkbox", undefined, "Unused pre-comps"); chkPrecomps.value = true;
        var chkFootage = grpWhat.add("checkbox", undefined, "Unused footage"); chkFootage.value = true;
        var grpAction = dlg.add("panel", undefined, "Action"); grpAction.orientation = "column"; grpAction.alignChildren = "left";
        var rMove = grpAction.add("radiobutton", undefined, "Move to 04 - Others / _Unused"); rMove.value = true;
        var rDel = grpAction.add("radiobutton", undefined, "Delete from project");
        var grpButtons = dlg.add("group"); grpButtons.alignment = "right"; grpButtons.add("button", undefined, "OK", { name: "ok" }); grpButtons.add("button", undefined, "Cancel", { name: "cancel" });
        if (dlg.show() !== 1) return;

        var proj = app.project; var usedMap = {};
        for (var c = 1; c <= proj.numItems; c++) { var it = proj.item(c); if(it instanceof CompItem){ for(var l=1; l<=it.numLayers; l++){ try{var s=it.layer(l).source; if(s) usedMap[s.id]=true;}catch(e){} } } }
        
        function getOrCreateFolder(name, parent) { if(!parent) parent=proj.rootFolder; for(var i=1; i<=proj.numItems; i++){ var x=proj.item(i); if(x instanceof FolderItem && x.parentFolder===parent && x.name===name) return x;} var n=proj.items.addFolder(name); n.parentFolder=parent; return n; }
        
        app.beginUndoGroup("Clean Unused");
        var unusedFolder = rMove.value ? getOrCreateFolder("_Unused", getOrCreateFolder("04 - Others")) : null;
        var count = 0;
        var items = []; for(var i=1; i<=proj.numItems; i++) items.push(proj.item(i));
        for(var j=0; j<items.length; j++){
            var item=items[j]; if(item instanceof FolderItem) continue;
            var isUsed = !!usedMap[item.id];
            var process = false;
            if(chkPrecomps.value && item instanceof CompItem && !isUsed && item.parentFolder !== proj.rootFolder) process=true;
            if(chkFootage.value && !(item instanceof CompItem) && !isUsed) process=true;
            
            if(process){
                if(rMove.value) item.parentFolder = unusedFolder;
                else try{item.remove();}catch(e){}
                count++;
            }
        }
        app.endUndoGroup();
        alert("Processed " + count + " items.");
    })();
}

// --- RENAMER ---
$._TheGlez.runRenamer = function() {
    (function () {
        if (!app || !app.project) return;
        var comp = app.project.activeItem; if (!comp || !comp.selectedLayers || comp.selectedLayers.length === 0) { alert("Select layers."); return; }
        var dlg = new Window("dialog", "Renamer"); dlg.orientation = "column"; dlg.alignChildren = "left";
        dlg.add("statictext", undefined, "Plug-in By The Glez");
        var grpPrefix = dlg.add("group"); grpPrefix.add("statictext", undefined, "Prefix:"); var txtPrefix = grpPrefix.add("edittext", undefined, ""); txtPrefix.characters = 10;
        var grpBase = dlg.add("group"); grpBase.add("statictext", undefined, "Name:"); var txtBase = grpBase.add("edittext", undefined, ""); txtBase.characters = 10;
        var grpSuffix = dlg.add("group"); grpSuffix.add("statictext", undefined, "Suffix:"); var txtSuffix = grpSuffix.add("edittext", undefined, ""); txtSuffix.characters = 10;
        var chkNum = dlg.add("checkbox", undefined, "Numbering"); chkNum.value = true;
        var grpBtns = dlg.add("group"); grpBtns.add("button", undefined, "OK", {name:"ok"}); grpBtns.add("button", undefined, "Cancel", {name:"cancel"});
        if (dlg.show() !== 1) return;

        app.beginUndoGroup("Renamer");
        var layers = comp.selectedLayers;
        var sorted = []; for(var i=0; i<layers.length; i++) sorted.push(layers[i]);
        sorted.sort(function(a,b){ return a.index - b.index; });
        for(var i=0; i<sorted.length; i++){
            var name = ""; if(txtPrefix.text) name += txtPrefix.text; if(txtBase.text) name += txtBase.text;
            if(chkNum.value) { var n = (i+1).toString(); while(n.length<2) n="0"+n; name += n; }
            if(txtSuffix.text) name += txtSuffix.text;
            if(name !== "") sorted[i].name = name;
        }
        app.endUndoGroup();
    })();
}

// --- ORGANIZER ---
$._TheGlez.runOrganizer = function() {
    (function () {
        if (!app || !app.project) {
            alert("No project open.");
            return;
        }

        var proj       = app.project;
        var rootFolder = proj.rootFolder;

        // Collect all comps
        var compItems = [];
        for (var i = 1; i <= proj.numItems; i++) {
            var it = proj.item(i);
            if (it instanceof CompItem) {
                compItems.push(it);
            }
        }

        var keepUserFolders = true;
        var useMaster       = false;
        var masterComp      = null;
        var presetAdvanced  = false;

        if (compItems.length > 0) {
            var compNames = [];
            for (var c = 0; c < compItems.length; c++) {
                compNames.push(compItems[c].name);
            }

            var dlg = new Window("dialog", "Project Organizer");
            dlg.orientation   = "column";
            dlg.alignChildren = "left";
            dlg.margins       = 12;

            var headline = dlg.add("statictext", undefined, "Plug-in By The Glez");
            headline.characters = 30;

            dlg.add("statictext", undefined, "Choose how you want to organize the project:");

            var grpPreset = dlg.add("group");
            grpPreset.orientation = "row";
            grpPreset.add("statictext", undefined, "Preset:");
            var ddPreset = grpPreset.add("dropdownlist", undefined, ["Basic (default)", "Advanced (sequences + renders folder)"]);
            ddPreset.selection = 0;

            var grpKeep = dlg.add("group");
            grpKeep.orientation = "row";
            var chkKeep = grpKeep.add("checkbox", undefined, "Keep existing folders (don’t move items inside them)");
            chkKeep.value = true;

            var grpMasterToggle = dlg.add("group");
            grpMasterToggle.orientation = "row";
            var chkMaster = grpMasterToggle.add("checkbox", undefined, "Use Master Comp (Output)");
            chkMaster.value = false;

            var grpComp = dlg.add("group");
            grpComp.orientation = "row";
            grpComp.add("statictext", undefined, "Master Comp:");
            var ddComp = grpComp.add("dropdownlist", undefined, compNames);
            ddComp.minimumSize.width = 260;
            ddComp.enabled = false;
            ddComp.selection = 0;

            chkMaster.onClick = function () {
                ddComp.enabled = chkMaster.value;
            };

            var grpButtons = dlg.add("group");
            grpButtons.alignment = "right";
            grpButtons.add("button", undefined, "OK",     { name: "ok" });
            grpButtons.add("button", undefined, "Cancel", { name: "cancel" });

            var res = dlg.show();
            if (res !== 1) {
                return; // cancelled
            }

            keepUserFolders = chkKeep.value;
            useMaster       = chkMaster.value;
            presetAdvanced  = (ddPreset.selection && ddPreset.selection.index === 1);

            if (useMaster && ddComp.selection) {
                masterComp = compItems[ddComp.selection.index];
            }

        } else {
            var cont = confirm("No compositions found in this project.\n\nDo you want to continue and just organize media by type?");
            if (!cont) return;
        }

        app.beginUndoGroup("Organize project by file type - The Glez");

        function getOrCreateFolder(name, parentFolder) {
            if (!parentFolder) parentFolder = rootFolder;
            for (var i = 1; i <= proj.numItems; i++) {
                var it = proj.item(i);
                if (it instanceof FolderItem && it.parentFolder === parentFolder && it.name === name) {
                    return it;
                }
            }
            var newFolder = proj.items.addFolder(name);
            newFolder.parentFolder = parentFolder;
            return newFolder;
        }

        var masterCompFolder = null;
        if (masterComp) {
            masterCompFolder = getOrCreateFolder("01 - Master Comp (Output)", rootFolder);
        }

        var preCompsFolder = getOrCreateFolder("02 - Pre-Comps", rootFolder);
        var footageRoot    = getOrCreateFolder("03 - Footage",   rootFolder);

        var imagesFolder   = getOrCreateFolder("3.1 - Images (Stills)", footageRoot);
        var videosFolder   = getOrCreateFolder("3.2 - Video",           footageRoot);
        var audioFolder    = getOrCreateFolder("3.3 - Audio",           footageRoot);
        var miscFootage    = getOrCreateFolder("3.4 - Misc",            footageRoot);

        var imgSeqFolder   = null;
        if (presetAdvanced) {
            imgSeqFolder = getOrCreateFolder("3.5 - Image Sequences", footageRoot);
        }

        var othersRoot     = getOrCreateFolder("04 - Others", rootFolder);
        var rendersRoot    = null;
        if (presetAdvanced) {
            rendersRoot = getOrCreateFolder("05 - Renders", rootFolder);
        }

        var specialFolders = [preCompsFolder, footageRoot, imagesFolder, videosFolder, audioFolder, miscFootage, othersRoot];
        if (masterCompFolder) specialFolders.push(masterCompFolder);
        if (imgSeqFolder) specialFolders.push(imgSeqFolder);
        if (rendersRoot) specialFolders.push(rendersRoot);

        function isSpecialFolder(item) {
            for (var i = 0; i < specialFolders.length; i++) {
                if (item === specialFolders[i]) return true;
            }
            return false;
        }

        var items = [];
        for (var i = 1; i <= proj.numItems; i++) {
            items.push(proj.item(i));
        }

        function getExtensionFromName(name) {
            name = name.toLowerCase();
            var dot = name.lastIndexOf(".");
            if (dot < 0 || dot === name.length - 1) return "";
            return name.substring(dot + 1);
        }

        function isImageSequenceName(name) {
            var lower = name.toLowerCase();
            var dot   = lower.lastIndexOf(".");
            if (dot < 0) return false;
            var base  = lower.substring(0, dot);
            var m = base.match(/(\d{3,6})$/);
            return m !== null;
        }

        var imageExts = { "jpg":1, "jpeg":1, "png":1, "tif":1, "tiff":1, "psd":1, "exr":1, "hdr":1, "tga":1, "bmp":1, "gif":1, "dpx":1, "cin":1, "webp":1 };
        var videoExts = { "mov":1, "mp4":1, "m4v":1, "avi":1, "mxf":1, "mkv":1, "mts":1, "m2ts":1, "wmv":1, "flv":1, "mpeg":1, "mpg":1 };
        var audioExts = { "wav":1, "aif":1, "aiff":1, "mp3":1, "m4a":1, "ogg":1 };

        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            if (isSpecialFolder(item)) continue;
            if (keepUserFolders && item.parentFolder !== rootFolder) continue;
            if (masterComp && item === masterComp && masterCompFolder) {
                item.parentFolder = masterCompFolder;
                continue;
            }
            if (item instanceof FolderItem) continue;

            if (item instanceof CompItem) {
                item.parentFolder = preCompsFolder;
                continue;
            }

            var ext = getExtensionFromName(item.name);

            if (audioExts[ext]) {
                item.parentFolder = audioFolder;
                continue;
            }

            if (imageExts[ext]) {
                if (presetAdvanced && imgSeqFolder && isImageSequenceName(item.name)) {
                    item.parentFolder = imgSeqFolder;
                } else {
                    item.parentFolder = imagesFolder;
                }
                continue;
            }

            if (videoExts[ext]) {
                item.parentFolder = videosFolder;
                continue;
            }

            if (ext === "") {
                item.parentFolder = othersRoot;
            } else {
                item.parentFolder = miscFootage;
            }
        }

        app.endUndoGroup();

    })();
}

// --- AUTO COLOR ---
$._TheGlez.runAutoColor = function() {
    (function () {
        if (!app || !app.project) {
            alert("No project open.");
            return;
        }

        var proj = app.project;
        var comp = proj.activeItem;

        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        if (!comp.selectedLayers || comp.selectedLayers.length === 0) {
            alert("Please select at least one layer in the active composition.");
            return;
        }

        var selLayers = comp.selectedLayers;

        // ------------------------------------------------
        // Label choices (AE default label set)
        // ------------------------------------------------
        var labelChoices = [
            { name: "No change", value: 0 },
            { name: "1 - Red",      value: 1 },
            { name: "2 - Yellow",   value: 2 },
            { name: "3 - Aqua",     value: 3 },
            { name: "4 - Pink",     value: 4 },
            { name: "5 - Lavender", value: 5 },
            { name: "6 - Peach",    value: 6 },
            { name: "7 - Seafoam",  value: 7 },
            { name: "8 - Blue",     value: 8 },
            { name: "9 - Green",    value: 9 },
            { name: "10 - Purple",  value: 10 },
            { name: "11 - Orange",  value: 11 },
            { name: "12 - Brown",   value: 12 },
            { name: "13 - Fuchsia", value: 13 },
            { name: "14 - Cyan",    value: 14 },
            { name: "15 - Sand",    value: 15 },
            { name: "16 - Smoke",   value: 16 }
        ];

        function createLabelDropdown(parent, label, defaultValue) {
            var g = parent.add("group");
            g.orientation = "row";
            g.add("statictext", undefined, label);

            var names = [];
            for (var i = 0; i < labelChoices.length; i++) {
                names.push(labelChoices[i].name);
            }

            var dd = g.add("dropdownlist", undefined, names);
            dd.minimumSize.width = 180;

            var defaultIndex = 0;
            for (var j = 0; j < labelChoices.length; j++) {
                if (labelChoices[j].value === defaultValue) {
                    defaultIndex = j;
                    break;
                }
            }
            dd.selection = defaultIndex;
            return dd;
        }

        // ------------------------------------------------
        // UI: Dialog
        // ------------------------------------------------
        var dlg = new Window("dialog", "Auto Type Color & Prefix");
        dlg.orientation   = "column";
        dlg.alignChildren = "left";
        dlg.margins       = 12;

        var headline = dlg.add("statictext", undefined, "Plug-in By The Glez");
        headline.characters = 30;

        dlg.add("statictext", undefined, "Choose label colors for each layer type:");

        var panelColors = dlg.add("panel", undefined, "Label colors by type");
        panelColors.orientation   = "column";
        panelColors.alignChildren = "left";
        panelColors.margins       = 10;

        var ddCam   = createLabelDropdown(panelColors, "Camera:",        4);  // Pink
        var ddLight = createLabelDropdown(panelColors, "Light:",         6);  // Peach
        var ddAud   = createLabelDropdown(panelColors, "Audio:",         7);  // Seafoam
        var ddPC    = createLabelDropdown(panelColors, "Pre-comp:",      15); // Sand (Composition)
        var ddVid   = createLabelDropdown(panelColors, "Footage Video:", 3);  // Aqua
        var ddImg   = createLabelDropdown(panelColors, "Footage Still:", 5);  // Lavender
        var ddTxt   = createLabelDropdown(panelColors, "Text:",          1);  // Red
        var ddShp   = createLabelDropdown(panelColors, "Shape:",         8);  // Blue
        var ddNull  = createLabelDropdown(panelColors, "Null:",          1);  // Red
        var ddAdj   = createLabelDropdown(panelColors, "Adjustment:",    5);  // Lavender
        var ddOth   = createLabelDropdown(panelColors, "Other:",         2);  // Yellow

        var panelOpts = dlg.add("panel", undefined, "Options");
        panelOpts.orientation   = "column";
        panelOpts.alignChildren = "left";
        panelOpts.margins       = 10;

        var grpPrefix = panelOpts.add("group");
        grpPrefix.orientation = "row";
        var chkAddPrefix = grpPrefix.add("checkbox", undefined, "Prepend type prefix to layer names");
        chkAddPrefix.value = true;

        var grpButtons = dlg.add("group");
        grpButtons.alignment = "right";
        grpButtons.add("button", undefined, "OK",     { name: "ok" });
        grpButtons.add("button", undefined, "Cancel", { name: "cancel" });

        var res = dlg.show();
        if (res !== 1) {
            return; // user cancelled
        }

        // ------------------------------------------------
        // Read label choices
        // ------------------------------------------------
        function getLabelFromDropdown(dd) {
            var idx = dd.selection ? dd.selection.index : 0;
            return labelChoices[idx].value;
        }

        var lblCam   = getLabelFromDropdown(ddCam);
        var lblLight = getLabelFromDropdown(ddLight);
        var lblAud   = getLabelFromDropdown(ddAud);
        var lblPC    = getLabelFromDropdown(ddPC);
        var lblVid   = getLabelFromDropdown(ddVid);
        var lblImg   = getLabelFromDropdown(ddImg);
        var lblTxt   = getLabelFromDropdown(ddTxt);
        var lblShp   = getLabelFromDropdown(ddShp);
        var lblNull  = getLabelFromDropdown(ddNull);
        var lblAdj   = getLabelFromDropdown(ddAdj);
        var lblOth   = getLabelFromDropdown(ddOth);

        var addPrefix = chkAddPrefix.value;

        // ------------------------------------------------
        // Prefix map
        // ------------------------------------------------
        var prefixMap = {
            camera:    "CAM - ",
            light:     "LGT - ",
            audio:     "AUD - ",
            precomp:   "PC - ",
            footVideo: "VID - ",
            footStill: "IMG - ",
            text:      "TXT - ",
            shape:     "SHP - ",
            "null":    "NULL - ",
            adjust:    "ADJ - ",
            other:     "OTH - "
        };

        // ------------------------------------------------
        // Helpers
        // ------------------------------------------------
        function isTextLayer(layer) {
            try {
                var st = layer.property("Source Text");
                return (st !== null && st !== undefined);
            } catch (e) {
                return false;
            }
        }

        function isShapeLayer(layer) {
            try {
                var grp = layer.property("ADBE Root Vectors Group");
                return (grp !== null && grp !== undefined);
            } catch (e) {
                return false;
            }
        }

        function isCameraLayer(layer) {
            try {
                if (layer instanceof CameraLayer) {
                    return true;
                }
            } catch (e) {
                try {
                    var camOpts = layer.property("ADBE Camera Options Group");
                    if (camOpts !== null && camOpts !== undefined) {
                        return true;
                    }
                } catch (e2) {}
            }
            return false;
        }

        function isLightLayer(layer) {
            try {
                if (layer instanceof LightLayer) {
                    return true;
                }
            } catch (e) {
                try {
                    var lgtOpts = layer.property("ADBE Light Options Group");
                    if (lgtOpts !== null && lgtOpts !== undefined) {
                        return true;
                    }
                } catch (e2) {}
            }
            return false;
        }

        function isAudioOnlyLayer(layer) {
            try {
                return (layer.hasAudio && !layer.hasVideo);
            } catch (e) {}
            return false;
        }

        function getSource(layer) {
            try {
                return layer.source;
            } catch (e) {
                return null;
            }
        }

        function isPrecompLayer(layer) {
            var src = getSource(layer);
            if (!src) return false;
            return (src instanceof CompItem);
        }

        function getExtensionFromName(name) {
            name = name.toLowerCase();
            var dot = name.lastIndexOf(".");
            if (dot < 0 || dot === name.length - 1) return "";
            return name.substring(dot + 1);
        }

        var imageExts = {
            "jpg":1, "jpeg":1, "png":1, "tif":1, "tiff":1,
            "psd":1, "exr":1, "hdr":1, "tga":1, "bmp":1,
            "gif":1, "dpx":1, "cin":1, "webp":1
        };

        var videoExts = {
            "mov":1, "mp4":1, "m4v":1, "avi":1, "mxf":1,
            "mkv":1, "mts":1, "m2ts":1, "wmv":1, "flv":1,
            "mpeg":1, "mpg":1
        };

        function classifyFootage(layer) {
            var src = getSource(layer);
            if (!src) return null;

            var name = src.name || layer.name;
            var ext  = getExtensionFromName(name);

            if (imageExts[ext]) return "footStill";
            if (videoExts[ext]) return "footVideo";

            return "footOther";
        }

        function startsWithPrefix(name, prefix) {
            if (!prefix || prefix === "") return false;
            if (!name) return false;
            if (name.length < prefix.length) return false;
            var start = name.substring(0, prefix.length);
            return start === prefix;
        }

        // ------------------------------------------------
        // Main logic
        // ------------------------------------------------
        app.beginUndoGroup("Auto Type Color & Prefix - The Glez");

        for (var k = 0; k < selLayers.length; k++) {
            var lyr = selLayers[k];

            var category = null;

            // Priority: camera, light, audio, text, shape, null, adjust, precomp, footage, other
            if (!category && isCameraLayer(lyr)) {
                category = "camera";
            }

            if (!category && isLightLayer(lyr)) {
                category = "light";
            }

            if (!category && isAudioOnlyLayer(lyr)) {
                category = "audio";
            }

            if (!category && isTextLayer(lyr)) {
                category = "text";
            }

            if (!category && isShapeLayer(lyr)) {
                category = "shape";
            }

            if (!category && lyr.nullLayer === true) {
                category = "null";
            }

            if (!category && lyr.adjustmentLayer === true) {
                category = "adjust";
            }

            if (!category && isPrecompLayer(lyr)) {
                category = "precomp";
            }

            if (!category) {
                var ftCat = classifyFootage(lyr);
                if (ftCat === "footVideo") {
                    category = "footVideo";
                } else if (ftCat === "footStill") {
                    category = "footStill";
                }
            }

            if (!category) {
                category = "other";
            }

            // Label por tipo
            var chosenLabel = 0;
            switch (category) {
                case "camera":    chosenLabel = lblCam;   break;
                case "light":     chosenLabel = lblLight; break;
                case "audio":     chosenLabel = lblAud;   break;
                case "precomp":   chosenLabel = lblPC;    break;
                case "footVideo": chosenLabel = lblVid;   break;
                case "footStill": chosenLabel = lblImg;   break;
                case "text":      chosenLabel = lblTxt;   break;
                case "shape":     chosenLabel = lblShp;   break;
                case "null":      chosenLabel = lblNull;  break;
                case "adjust":    chosenLabel = lblAdj;   break;
                case "other":     chosenLabel = lblOth;   break;
            }

            if (chosenLabel > 0) {
                lyr.label = chosenLabel;
            }

            // Prefixo
            if (addPrefix) {
                var prefix = prefixMap[category];
                if (prefix && prefix.length > 0) {
                    var originalName = lyr.name;
                    if (!startsWithPrefix(originalName, prefix)) {
                        lyr.name = prefix + originalName;
                    }
                }
            }
        }

        app.endUndoGroup();

    })();
}