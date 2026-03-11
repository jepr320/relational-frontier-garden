import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore: inline script bundled by Quartz build
import script from "./scripts/suggestion-box.inline"
import style from "./styles/suggestion-box.scss"

interface Options {
  /**
   * Formspree form ID — the part after https://formspree.io/f/
   * Get one at https://formspree.io (free tier: 50 submissions/month)
   */
  formspreeId: string
}

export default ((opts?: Options) => {
  const SuggestionBox: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    // Only render on the suggest page
    if (fileData.slug !== "suggest") return <></>

    const formspreeId = opts?.formspreeId ?? "YOUR_FORM_ID"

    return (
      <div class={`suggestion-box ${displayClass ?? ""}`} data-formspree-id={formspreeId}>
        <div class="suggestion-box-inner">
          {/* The form */}
          <form id="suggestion-form" class="suggestion-form" noValidate aria-label="Node suggestion form">
            {/* Topic Name */}
            <div class="field-group">
              <label htmlFor="sb-topic">
                Topic Name{" "}
                <span class="required" aria-label="required">
                  *
                </span>
              </label>
              <input
                type="text"
                id="sb-topic"
                name="topic"
                required
                placeholder="e.g. Simone Weil, Attention, Lectio Divina"
                autoComplete="off"
                aria-required="true"
              />
            </div>

            {/* Category */}
            <div class="field-group">
              <label htmlFor="sb-category">
                Category{" "}
                <span class="required" aria-label="required">
                  *
                </span>
              </label>
              <div class="select-wrapper">
                <select
                  id="sb-category"
                  name="category"
                  required
                  aria-required="true"
                >
                  <option value="">Select a category…</option>
                  <option value="concepts">Concepts</option>
                  <option value="people">People</option>
                  <option value="practices">Practices</option>
                  <option value="traditions">Traditions</option>
                  <option value="works">Works</option>
                </select>
                <span class="select-arrow" aria-hidden="true">▾</span>
              </div>
            </div>

            {/* Why */}
            <div class="field-group">
              <label htmlFor="sb-why">
                Why does this belong?{" "}
                <span class="required" aria-label="required">
                  *
                </span>
              </label>
              <textarea
                id="sb-why"
                name="why"
                required
                rows={5}
                placeholder="What is this node's connection to the themes of relational depth, meaning, and the human encounter with reality? Even a sentence or two is enough."
                aria-required="true"
              />
            </div>

            {/* Submitter Name */}
            <div class="field-group">
              <label htmlFor="sb-name">
                Your Name{" "}
                <span class="optional">(optional)</span>
              </label>
              <input
                type="text"
                id="sb-name"
                name="name"
                placeholder="How you'd like to be credited, if credited"
                autoComplete="name"
              />
            </div>

            {/* Honeypot — hidden from real users, traps bots */}
            <input
              type="text"
              name="_gotcha"
              style="display:none !important"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {/* Validation message area */}
            <div id="sb-validation-msg" class="validation-msg" role="alert" aria-live="polite" />

            <div class="form-actions">
              <button type="submit" class="submit-btn" id="sb-submit">
                <span class="btn-text">Suggest this node</span>
                <span class="btn-loading" aria-hidden="true">Sending…</span>
              </button>
            </div>
          </form>

          {/* Success state */}
          <div
            id="sb-success"
            class="sb-state-panel sb-success"
            role="status"
            aria-live="polite"
            aria-hidden="true"
          >
            <div class="success-sigil" aria-hidden="true">✦</div>
            <h3>Received.</h3>
            <p>
              Your suggestion has been sent. Whether or not it finds its way into the garden, the
              discernment behind it is part of what keeps the inquiry alive.
            </p>
            <button type="button" class="reset-btn" id="sb-reset">
              Suggest another
            </button>
          </div>

          {/* Error state */}
          <div
            id="sb-error"
            class="sb-state-panel sb-error"
            role="alert"
            aria-live="polite"
            aria-hidden="true"
          >
            <p>
              Something went wrong on our end. Please try again, or{" "}
              <a href="https://relationalfrontier.com">reach out directly</a>.
            </p>
            <button type="button" class="reset-btn" id="sb-retry">
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  SuggestionBox.css = style
  SuggestionBox.afterDOMLoaded = script

  return SuggestionBox
}) satisfies QuartzComponentConstructor<Options | undefined>
