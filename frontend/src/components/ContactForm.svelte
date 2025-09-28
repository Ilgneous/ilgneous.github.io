<script lang="ts">
  let name="", email="", message="", status: "idle"|"ok"|"err" = "idle";
  const API = import.meta.env.PUBLIC_API_URL ?? "https://api.example.com";
  async function submit(e: Event) {
    e.preventDefault();
    if (message.trim().length < 5) { status="err"; return; }
    const res = await fetch(`${API}/api/contact`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message })
    });
    status = res.ok ? "ok" : "err";
  }
</script>

<form on:submit={submit} class="space-y-3 max-w-md">
  <input class="w-full border p-2 rounded" placeholder="Name" bind:value={name} required />
  <input class="w-full border p-2 rounded" type="email" placeholder="Email" bind:value={email} required />
  <textarea class="w-full border p-2 rounded" rows="5" placeholder="Message" bind:value={message} required />
  <button class="rounded bg-black text-white px-3 py-2">Send</button>
  {#if status==="ok"}<p class="text-green-700">Thanks! I’ll reply soon.</p>{/if}
  {#if status==="err"}<p class="text-red-700">Please check your message or try again.</p>{/if}
</form>
