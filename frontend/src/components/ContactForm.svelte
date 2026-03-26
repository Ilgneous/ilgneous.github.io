<script lang="ts">
  let name="", email="", message="", status: "idle"|"ok"|"err" = "idle";
  export let apiBase: string | undefined = undefined;

  async function submit(e: Event) {
    e.preventDefault();
    if (message.trim().length < 5) { status="err"; return; }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      status = res.ok ? "ok" : "err";
    } catch {
      status = "err";
    }
  }
</script>

<form on:submit={submit} class="space-y-3 w-full">
  <input
    class="input w-full"
    placeholder="Name"
    bind:value={name}
    required
  />
  <input
    class="input w-full"
    type="email"
    placeholder="Email"
    bind:value={email}
    required
  />
  <textarea
    class="input w-full min-h-28"
    rows="5"
    placeholder="Message"
    bind:value={message}
    required
  ></textarea>
  <button class="btn-primary w-full" type="submit">Send message</button>
  {#if status==="ok"}
    <p class="text-sm text-emerald-400/80">Thanks! I'll reply soon.</p>
  {/if}
  {#if status==="err"}
    <p class="text-sm text-red-400/80">Please check your message or try again.</p>
  {/if}
</form>