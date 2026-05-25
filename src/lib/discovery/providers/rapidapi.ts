import "server-only";

import type { DiscoveryInput, DiscoveryProvider, RawBusiness } from "@/lib/discovery/types";

export class RapidApiProvider implements DiscoveryProvider {
  constructor(
    private readonly config: {
      apiKey: string;
      timeoutMs: number;
    },
  ) {}

  async search(input: DiscoveryInput): Promise<RawBusiness[]> {
    void input;
    void this.config;
    throw new Error("RapidAPI discovery provider is configured but not implemented yet.");
  }
}
