/**
 * DiscoveryProvider interface skeleton (Phase 2 implements).
 *
 * Two concrete providers will land in Phase 2:
 *   - `GooglePlacesProvider` — official, predictable cost, default
 *   - `RapidApiProvider`     — fallback (cheaper, ToS-risky, may disappear)
 *
 * Selection is env-driven (`DISCOVERY_PROVIDER`). Upstream code must NEVER
 * import a concrete provider — always go through the Phase 2 factory.
 * This keeps the rest of the pipeline blind to where leads came from
 * (CLAUDE.md §6).
 */
export interface DiscoveryInput {
  /** Free-form city / region name (e.g. "Kadıköy, İstanbul"). */
  location: string;
  /** Business category — must align with industry template keys in Phase 3. */
  category: string;
  /** Search radius in meters. Provider clamps this to its own max. */
  radiusM: number;
  /**
   * Max results to return. Set by the caller (Server Action) based on the
   * user's plan — providers MUST clamp to their own ceiling. The plan cap is
   * enforced upstream; this is the wire-level limit handed to the API.
   */
  maxResults?: number;
}

/**
 * Raw business row returned by the provider. Mirrors CLAUDE.md §7.1
 * `BusinessLead` but stays loose so providers can supply only the fields
 * they have — Phase 2 enrichment is responsible for filling gaps.
 */
export interface RawBusiness {
  placeId: string;
  name: string;
  category?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  rating?: number;
  reviewCount?: number;
  openingHours?: string[];
  photos?: string[];
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    tiktok?: string;
  };
}

export interface DiscoveryProvider {
  /**
   * Return a list of businesses matching the input. Implementations MUST:
   *   - dedupe by `placeId` within a single response
   *   - return an empty array (never throw) on "no results"
   *   - throw on auth / network / quota errors so the orchestrator can retry
   */
  search(input: DiscoveryInput): Promise<RawBusiness[]>;
}
