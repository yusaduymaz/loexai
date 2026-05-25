import "server-only";

import type { DiscoveryInput, DiscoveryProvider, RawBusiness } from "@/lib/discovery/types";

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  primaryTypeDisplayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  photos?: Array<{ name?: string }>;
  addressComponents?: Array<{
    longText?: string;
    types?: string[];
  }>;
};

type GoogleTextSearchResponse = {
  places?: GooglePlace[];
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.primaryTypeDisplayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours",
  "places.photos",
].join(",");

export class GooglePlacesProvider implements DiscoveryProvider {
  constructor(
    private readonly config: {
      apiKey: string;
      timeoutMs: number;
    },
  ) {}

  async search(input: DiscoveryInput): Promise<RawBusiness[]> {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.config.apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: `${input.category} in ${input.location}`,
        pageSize: 20,
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Google Places search failed (${response.status}): ${details}`);
    }

    const payload = (await response.json()) as GoogleTextSearchResponse;
    const seen = new Set<string>();

    return (payload.places ?? []).flatMap((place) => {
      if (!place.id || !place.displayName?.text || seen.has(place.id)) {
        return [];
      }

      seen.add(place.id);

      return [
        {
          placeId: place.id,
          name: place.displayName.text,
          category: place.primaryTypeDisplayName?.text ?? input.category,
          address: place.formattedAddress,
          city: getAddressComponent(place, "locality") ?? getAddressComponent(place, "postal_town"),
          country: getAddressComponent(place, "country"),
          phone: place.nationalPhoneNumber,
          website: place.websiteUri,
          googleMapsUrl: place.googleMapsUri,
          rating: place.rating,
          reviewCount: place.userRatingCount,
          openingHours: place.regularOpeningHours?.weekdayDescriptions,
          photos: place.photos?.map((photo) => photo.name).filter(Boolean) as string[] | undefined,
        },
      ];
    });
  }
}

function getAddressComponent(place: GooglePlace, type: string) {
  return place.addressComponents?.find((component) => component.types?.includes(type))?.longText;
}
