// Live multiplayer for the hosted version of Blob Tag.
// Players in the same room share one Supabase Realtime channel. Each player broadcasts their own
// state about ten times a second; nothing is stored. The key below is a publishable (public) key.
(function () {
  "use strict";
  var URL = "https://muzcxirewzeqmmxxvowk.supabase.co";
  var KEY = "sb_publishable_CzJ54kTgvNKIDGSmZ8zFHg_lVe57CLY";
  var SEND_MS = 100, IDLE_MS = 1000, GONE_MS = 4000;
  var client = null;
  try { client = window.supabase.createClient(URL, KEY, { realtime: { params: { eventsPerSecond: 12 } } }); } catch (err) { client = null; }
  var myId = Math.random().toString(36).slice(2, 12);

  function makeRoom(name) {
    var channel = client.channel("blobtag-" + name, { config: { broadcast: { self: false } } });
    var peers = {}, state = {}, handlers = [], joined = false, dirty = false, lastSent = "", lastAt = 0, failed = false, errs = [];
    function snapshot() {
      var list = [{ peer: myId, isMe: true, sameTab: true, kind: "viewer", presence: state }];
      for (var id in peers) { list.push({ peer: id, isMe: false, sameTab: false, kind: "viewer", presence: peers[id].p }); }
      return list;
    }
    function notify() { dirty = false; var list = snapshot(); handlers.forEach(function (h) { h({ peers: list }); }); }
    function schedule() { if (!dirty) { dirty = true; requestAnimationFrame(notify); } }
    channel.on("broadcast", { event: "s" }, function (msg) {
      var d = msg && msg.payload;
      if (!d || typeof d.id !== "string" || d.id === myId || !d.p || typeof d.p !== "object") { return; }
      peers[d.id.slice(0, 16)] = { p: d.p, at: Date.now() }; schedule();
    });
    channel.on("broadcast", { event: "bye" }, function (msg) {
      var d = msg && msg.payload; if (d && peers[d.id]) { delete peers[d.id]; schedule(); }
    });
    var ready = new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error("timeout")); }, 10000);
      channel.subscribe(function (status) {
        if (status === "SUBSCRIBED") { joined = true; clearTimeout(timer); resolve(); schedule(); }
        else if (status === "CHANNEL_ERROR" && !joined) { clearTimeout(timer); reject(new Error(status)); }
      });
    });
    var tick = setInterval(function () {
      var now = Date.now(), changed = false;
      for (var id in peers) { if (now - peers[id].at > GONE_MS) { delete peers[id]; changed = true; } }
      if (changed) { schedule(); }
      if (!joined || failed) { return; }
      var text = JSON.stringify(state);
      if (text === "{}" || (text === lastSent && now - lastAt < IDLE_MS)) { return; }
      lastSent = text; lastAt = now;
      channel.send({ type: "broadcast", event: "s", payload: { id: myId, p: state } });
    }, SEND_MS);
    window.addEventListener("pagehide", function () {
      if (joined) { channel.send({ type: "broadcast", event: "bye", payload: { id: myId } }); }
    });
    return {
      ready: ready,
      presence: function (patch) {
        var next = {};
        for (var k in state) { next[k] = state[k]; }
        for (var p in patch) { if (patch[p] === null) { delete next[p]; } else { next[p] = patch[p]; } }
        state = next; return Promise.resolve();
      },
      onPeers: function (handler, onError) {
        handlers.push(handler); if (onError) { errs.push(onError); } schedule();
        return function () { handlers = handlers.filter(function (h) { return h !== handler; }); };
      },
      stop: function () { failed = true; clearInterval(tick); }
    };
  }

  var rooms = {};
  function getRoom(name) {
    if (!rooms[name]) { rooms[name] = makeRoom(name); }
    return rooms[name].ready.then(function () { return rooms[name]; });
  }
  var lobby = {
    // The main room is only joined when the game starts using it.
    presence: function (patch) { return getRoom("main").then(function (r) { return r.presence(patch); }); },
    onPeers: function (handler, onError) {
      var off = null, cancelled = false;
      getRoom("main").then(function (r) { if (!cancelled) { off = r.onPeers(handler); } }, function () { if (onError) { onError({ code: "upstream_error" }); } });
      return function () { cancelled = true; if (off) { off(); } };
    },
    join: function (name) { return getRoom(String(name).toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 48) || "main"); }
  };
  window.claude = { use: function (name) { return Promise.resolve(name === "room" && client ? lobby : null); } };
})();
