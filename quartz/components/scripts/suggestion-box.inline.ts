/**
 * Suggestion Box — inline client script
 * Runs on every `nav` event (Quartz SPA navigation).
 * Only acts when the `.suggestion-box` container is present on the page.
 */

type State = "form" | "success" | "error"

document.addEventListener("nav", () => {
  const container = document.querySelector<HTMLElement>(".suggestion-box")
  if (!container) return

  const formspreeId = container.dataset.formspreeId
  if (!formspreeId || formspreeId === "YOUR_FORM_ID") {
    // Dev/unconfigured state — show a warning in the console, keep the form visible
    console.warn("[SuggestionBox] Formspree ID not configured. Set formspreeId in quartz.layout.ts.")
    return
  }

  const form = document.getElementById("suggestion-form") as HTMLFormElement | null
  const successPanel = document.getElementById("sb-success") as HTMLElement | null
  const errorPanel = document.getElementById("sb-error") as HTMLElement | null
  const submitBtn = document.getElementById("sb-submit") as HTMLButtonElement | null
  const resetBtn = document.getElementById("sb-reset") as HTMLButtonElement | null
  const retryBtn = document.getElementById("sb-retry") as HTMLButtonElement | null
  const validationMsg = document.getElementById("sb-validation-msg") as HTMLElement | null

  if (!form || !successPanel || !errorPanel || !submitBtn) return

  // ── State management ─────────────────────────────────────────────────────────
  const setState = (state: State) => {
    const isForm = state === "form"
    const isSuccess = state === "success"
    const isError = state === "error"

    form.style.display = isForm ? "" : "none"
    form.setAttribute("aria-hidden", String(!isForm))

    successPanel.style.display = isSuccess ? "" : "none"
    successPanel.setAttribute("aria-hidden", String(!isSuccess))

    errorPanel.style.display = isError ? "" : "none"
    errorPanel.setAttribute("aria-hidden", String(!isError))
  }

  // Start in form state
  setState("form")
  if (validationMsg) validationMsg.textContent = ""

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const topic = (document.getElementById("sb-topic") as HTMLInputElement)?.value.trim()
    const category = (document.getElementById("sb-category") as HTMLSelectElement)?.value
    const why = (document.getElementById("sb-why") as HTMLTextAreaElement)?.value.trim()

    if (!topic) {
      if (validationMsg) validationMsg.textContent = "Please enter a topic name."
      document.getElementById("sb-topic")?.focus()
      return false
    }
    if (!category) {
      if (validationMsg) validationMsg.textContent = "Please select a category."
      document.getElementById("sb-category")?.focus()
      return false
    }
    if (!why) {
      if (validationMsg) validationMsg.textContent = "Please tell us why this belongs."
      document.getElementById("sb-why")?.focus()
      return false
    }

    if (validationMsg) validationMsg.textContent = ""
    return true
  }

  // Clear validation message on input
  const clearValidation = () => {
    if (validationMsg) validationMsg.textContent = ""
  }

  const inputs = form.querySelectorAll("input, select, textarea")
  inputs.forEach((el) => {
    el.addEventListener("input", clearValidation)
    window.addCleanup(() => el.removeEventListener("input", clearValidation))
  })

  // ── Submission ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: Event) => {
    e.preventDefault()

    if (!validate()) return

    submitBtn.disabled = true
    submitBtn.classList.add("loading")

    const data = new FormData(form)

    try {
      const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      })

      if (response.ok) {
        setState("success")
        // Scroll success panel into view gently
        successPanel?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      } else {
        console.error("[SuggestionBox] Formspree error:", response.status, await response.text())
        setState("error")
      }
    } catch (err) {
      console.error("[SuggestionBox] Network error:", err)
      setState("error")
    } finally {
      submitBtn.disabled = false
      submitBtn.classList.remove("loading")
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────────
  const handleReset = () => {
    form.reset()
    if (validationMsg) validationMsg.textContent = ""
    setState("form")
    // Return focus to the first field
    ;(document.getElementById("sb-topic") as HTMLInputElement)?.focus()
  }

  const handleRetry = () => {
    setState("form")
    // Return focus to submit
    submitBtn?.focus()
  }

  // ── Event wiring ─────────────────────────────────────────────────────────────
  form.addEventListener("submit", handleSubmit)
  resetBtn?.addEventListener("click", handleReset)
  retryBtn?.addEventListener("click", handleRetry)

  window.addCleanup(() => {
    form.removeEventListener("submit", handleSubmit)
    resetBtn?.removeEventListener("click", handleReset)
    retryBtn?.removeEventListener("click", handleRetry)
  })
})
