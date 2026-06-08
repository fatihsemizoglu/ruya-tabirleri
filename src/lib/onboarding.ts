const ONBOARDING_TOUR_KEY = 'hasSeenOnboardingTour';

export function resetOnboardingTour() {
  localStorage.removeItem(ONBOARDING_TOUR_KEY);
}
