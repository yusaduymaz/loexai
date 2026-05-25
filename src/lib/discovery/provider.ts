import "server-only";

import { requireDiscoveryRuntimeConfig } from "@/lib/discovery/config";
import type { DiscoveryProvider } from "@/lib/discovery/types";
import { GooglePlacesProvider } from "@/lib/discovery/providers/google-places";
import { RapidApiProvider } from "@/lib/discovery/providers/rapidapi";

export function createDiscoveryProvider(): DiscoveryProvider {
  const config = requireDiscoveryRuntimeConfig();

  if (config.provider === "google_places") {
    return new GooglePlacesProvider(config);
  }

  return new RapidApiProvider(config);
}
