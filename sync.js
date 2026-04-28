// ============================================================
// MyDailyTracler - Supabase sync layer (optional)
// ------------------------------------------------------------
// If config.js has valid SUPABASE_CONFIG values, this module:
//   1. Loads the supabase-js client from CDN.
//   2. Signs the user in anonymously (creates an account on first run).
//   3. Pulls existing entries from the server on startup.
//   4. Pushes inserts / updates / deletes whenever app.js notifies it.
// If config is empty, it stays a no-op and the app remains 100% local.
// ============================================================

window.MDTSync = (function () {
  const cfg = window.SUPABASE_CONFIG || {};
  const enabled = !!(cfg.url && cfg.anonKey);

  let client = null;
  let userId = null;
  let onPullCallback = null;
  let ready = false;

  async function init(onPull) {
    onPullCallback = onPull;
    if (!enabled) {
      setStatus("local-only", "Local only");
      return { enabled: false };
    }

    setStatus("connecting", "Connecting...");
    try {
      const mod = await import("https://esm.sh/@supabase/supabase-js@2");
      client = mod.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      });

      const { data: sessionData } = await client.auth.getSession();
      let session = sessionData.session;

      if (!session) {
        const { data, error } = await client.auth.signInAnonymously();
        if (error) throw error;
        session = data.session;
      }

      userId = session.user.id;
      ready = true;
      setStatus("online", "Synced");
      await pull();
      return { enabled: true, userId };
    } catch (err) {
      console.error("[sync] init failed:", err);
      setStatus("error", "Offline (local only)");
      ready = false;
      return { enabled: false, error: err };
    }
  }

  async function pull() {
    if (!ready) return [];
    const { data, error } = await client
      .from("entries")
      .select("*")
      .order("end_time", { ascending: false });
    if (error) {
      console.error("[sync] pull failed:", error);
      return [];
    }
    const remote = data.map(rowToEntry);
    if (onPullCallback) onPullCallback(remote);
    return remote;
  }

  async function pushUpsert(entry) {
    if (!ready) return;
    const { error } = await client.from("entries").upsert(entryToRow(entry, userId));
    if (error) console.error("[sync] upsert failed:", error);
  }

  async function pushDelete(id) {
    if (!ready) return;
    const { error } = await client.from("entries").delete().eq("id", id);
    if (error) console.error("[sync] delete failed:", error);
  }

  function rowToEntry(r) {
    return {
      id: r.id,
      categoryId: r.category_id,
      start: r.start_time,
      end: r.end_time,
      minutes: r.minutes,
      note: r.note || "",
    };
  }

  function entryToRow(e, uid) {
    return {
      id: e.id,
      user_id: uid,
      category_id: e.categoryId,
      start_time: e.start,
      end_time: e.end,
      minutes: e.minutes,
      note: e.note || "",
    };
  }

  function setStatus(kind, label) {
    const el = document.getElementById("sync-status");
    if (!el) return;
    el.dataset.kind = kind;
    el.textContent = label;
  }

  return { init, pull, pushUpsert, pushDelete, isEnabled: () => enabled };
})();
