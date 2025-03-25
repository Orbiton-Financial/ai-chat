// lib/mixpanel.ts
import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!;

export const initMixpanel = () => {
  // Initialize only on the client side.
  if (typeof window !== "undefined" && MIXPANEL_TOKEN) {
    mixpanel.init(MIXPANEL_TOKEN, { debug: process.env.NODE_ENV === "development" });
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (typeof window !== "undefined") {
    mixpanel.track(eventName, properties);
  }
};

export default mixpanel;
