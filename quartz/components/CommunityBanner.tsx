import { QuartzComponent, QuartzComponentConstructor } from "./types"

const CommunityBanner: QuartzComponent = () => {
  return (
    <div class="community-banner">
      <span class="community-banner-text">
        Part of{" "}
        <a href="https://relationalfrontier.com" class="community-banner-link">
          Relational Frontier
        </a>
        {" — "}
        <a href="https://relationalfrontier.com" class="community-banner-cta">
          Join the community →
        </a>
      </span>
    </div>
  )
}

CommunityBanner.css = `
.community-banner {
  width: 100%;
  text-align: center;
  padding: 0.45rem 1rem;
  background-color: var(--rf-parchment, #f5f0e6);
  border-bottom: 1px solid var(--rf-amber, #c8973a);
  font-size: 0.8rem;
  font-family: "Source Serif 4", Georgia, serif;
  letter-spacing: 0.02em;
  color: var(--rf-forest, #3a5a3a);
}

.community-banner a {
  color: var(--rf-forest, #3a5a3a);
  text-decoration: none;
}

.community-banner-link {
  font-weight: 600;
}

.community-banner-link:hover,
.community-banner-cta:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.community-banner-cta {
  opacity: 0.85;
}

@media (prefers-color-scheme: dark) {
  .community-banner {
    background-color: rgba(58, 90, 58, 0.12);
    border-bottom-color: rgba(200, 151, 58, 0.35);
    color: var(--rf-parchment, #e8e2d4);
  }

  .community-banner a {
    color: var(--rf-parchment, #e8e2d4);
  }
}
`

export default (() => CommunityBanner) satisfies QuartzComponentConstructor
