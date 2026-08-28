# Thrail App — File Structure

> **Last Updated:** 2026-08-28
>
> This document maps the complete directory structure of the Thrail App project.
> Use it as a quick reference when navigating the codebase.

---

## Directory Tree

```text
thrail_app/
├── README.md
├── app.json
├── DEBT_CHECKLIST.md
├── eslint.config.js
├── expo-router.config.mjs
├── FILE_STRUCTURE.md              ← You are here
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── FRONTEND_CHECKLIST.md
├── jest.setup.js
├── metro.config.js
├── package.json
├── storage.rules
├── tmp_script.js
├── ts_errors.txt
├── tsconfig.json
├── .easignore
├── .firebaserc
│
├── .agents/                       ← AI Agent skills, rules, and routing
│   ├── AGENTS.md                  ← Skill router + mandatory rules
│   ├── rules/
│   │   └── corrections.md         ← Persistent "don't do this" log
│   └── skills/
│       ├── design-critique/
│       │   └── SKILL.md
│       ├── github-workflow/
│       │   └── SKILL.md
│       ├── systematic-debugging/
│       │   └── SKILL.md
│       ├── thrail-be/
│       │   └── SKILL.md
│       └── thrail-fe/
│           └── SKILL.md
│
├── __mocks__/
│   └── @react-native-google-signin/
│       └── google-signin.js
│
├── emulator_data/                 ← Firebase emulator snapshots
│   ├── firebase-export-metadata.json
│   ├── auth_export/
│   │   ├── accounts.json
│   │   └── config.json
│   ├── firestore_export/
│   │   └── firestore_export.overall_export_metadata
│   └── storage_export/
│       └── buckets.json
│
├── functions/                     ← Firebase Cloud Functions
│   ├── index.js
│   ├── package.json
│   ├── .eslintrc.js
│   └── services/
│       ├── PaymentManager.js
│       └── providers/
│           └── PayMongoProvider.js
│
├── recommendation_engine/         ← Python recommendation service (TARS)
│   ├── README.md
│   ├── app.py
│   ├── requirements.txt
│   ├── benchmarks/
│   │   ├── __init__.py
│   │   ├── benchmark_evaluator.py
│   │   └── recommendation_scratchpad.ipynb
│   ├── core/
│   │   ├── __init__.py
│   │   ├── distance_strategies.py
│   │   ├── gower_engine.py
│   │   ├── profile_manager.py
│   │   └── recommender.py
│   ├── data/
│   │   ├── trails_mock.csv
│   │   └── user_ratings_mock.csv
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_client.py
│   │   └── test_tars_recommender.py
│   └── visualizer/
│       ├── README.md
│       ├── run_visualizer.py
│       └── tars_interactive_dashboard.html
│
├── scripts/                       ← Build & dev utility scripts
│   ├── debug-geojson.js
│   ├── generate-trail-maps.js
│   ├── reset-project.js
│   └── snapshot-template.html
│
├── src/                           ← Main application source
│   │
│   ├── app/                       ← Expo Router file-based routes
│   │   ├── +not-found.tsx
│   │   ├── _layout.tsx            ← Root layout
│   │   ├── index.tsx
│   │   ├── loading.tsx
│   │   ├── maintenance.tsx
│   │   ├── payment-result.tsx
│   │   ├── reset-password.tsx
│   │   ├── unauthorized.tsx
│   │   │
│   │   ├── (auth)/                ← Auth flow controllers
│   │   │   ├── _layout.tsx
│   │   │   ├── forgotPassword.tsx
│   │   │   ├── information.tsx
│   │   │   ├── landing.tsx
│   │   │   ├── login.tsx
│   │   │   ├── preference.tsx
│   │   │   ├── privacy.tsx
│   │   │   ├── signup.tsx
│   │   │   ├── tac.tsx
│   │   │   └── terms.tsx
│   │   │
│   │   ├── (main)/                ← Main app controllers
│   │   │   ├── _layout.tsx
│   │   │   ├── admin/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── index.tsx
│   │   │   │   ├── booking/
│   │   │   │   │   └── view.tsx
│   │   │   │   ├── offer/
│   │   │   │   │   ├── list.tsx
│   │   │   │   │   ├── view.tsx
│   │   │   │   │   └── write.tsx
│   │   │   │   └── personnel/
│   │   │   │       ├── list.tsx
│   │   │   │       └── write.tsx
│   │   │   ├── book/
│   │   │   │   └── list.tsx
│   │   │   ├── business/
│   │   │   │   └── apply.tsx
│   │   │   ├── group/
│   │   │   │   ├── list.tsx
│   │   │   │   └── room.tsx
│   │   │   ├── hike/
│   │   │   │   └── view.tsx
│   │   │   ├── home/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── notification.tsx
│   │   │   │   └── weather.tsx
│   │   │   ├── leaderboard/
│   │   │   │   └── view.tsx
│   │   │   ├── notification/
│   │   │   │   └── view.tsx
│   │   │   ├── offer/
│   │   │   │   └── list.tsx
│   │   │   ├── receipt/
│   │   │   │   └── view.tsx
│   │   │   ├── review/
│   │   │   │   └── write.tsx
│   │   │   ├── settings/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── about/
│   │   │   │   │   └── index.tsx
│   │   │   │   ├── help/
│   │   │   │   │   └── index.tsx
│   │   │   │   ├── notifications/
│   │   │   │   │   └── index.tsx
│   │   │   │   ├── preferences/
│   │   │   │   │   └── index.tsx
│   │   │   │   ├── privacy/
│   │   │   │   │   └── index.tsx
│   │   │   │   └── security/
│   │   │   │       └── index.tsx
│   │   │   ├── superadmin/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── index.tsx
│   │   │   │   ├── application/
│   │   │   │   │   ├── list.tsx
│   │   │   │   │   └── view.tsx
│   │   │   │   ├── business/
│   │   │   │   │   ├── approve.tsx
│   │   │   │   │   └── list.tsx
│   │   │   │   ├── mountain/
│   │   │   │   │   ├── list.tsx
│   │   │   │   │   ├── view.tsx
│   │   │   │   │   └── write.tsx
│   │   │   │   ├── trail/
│   │   │   │   │   ├── list.tsx
│   │   │   │   │   ├── map-editor.tsx
│   │   │   │   │   └── write.tsx
│   │   │   │   └── user/
│   │   │   │       └── list.tsx
│   │   │   ├── trail/
│   │   │   │   └── view.tsx
│   │   │   └── user/
│   │   │       └── view.tsx
│   │   │
│   │   └── (tabs)/                ← Bottom tab controllers
│   │       ├── _layout.tsx
│   │       ├── community.tsx
│   │       ├── explore.tsx
│   │       ├── hike.tsx
│   │       ├── index.tsx
│   │       ├── profile.tsx
│   │       └── test.tsx
│   │
│   ├── assets/                    ← Static assets (fonts, tiles, map data)
│   │   ├── fonts/
│   │   │   ├── Noto Sans Medium/  ← .pbf glyph files (map labels)
│   │   │   └── Noto Sans Regular/ ← .pbf glyph files (map labels)
│   │   └── map_data/
│   │       └── map_data_report.json
│   │
│   ├── components/                ← Shared UI components (Mandatory Library)
│   │   ├── ConfirmationModal.tsx
│   │   ├── CustomButton.tsx
│   │   ├── CustomCalendarInput.tsx
│   │   ├── CustomDateInput.tsx
│   │   ├── CustomDropdown.tsx
│   │   ├── CustomFAB.tsx
│   │   ├── CustomFeedbackInput.tsx
│   │   ├── CustomFilterModal.tsx
│   │   ├── CustomFilterTabs.tsx
│   │   ├── CustomHeader.tsx
│   │   ├── CustomIcon.tsx
│   │   ├── CustomImage.tsx
│   │   ├── CustomLoading.tsx
│   │   ├── CustomNavBar.tsx
│   │   ├── CustomSearchBar.tsx
│   │   ├── CustomSelectionModal.tsx
│   │   ├── CustomStickyFooter.tsx
│   │   ├── CustomText.tsx
│   │   ├── CustomTextInput.tsx
│   │   ├── CustomToast.tsx
│   │   ├── CustomWriteComponents.tsx
│   │   ├── DocumentUploadCard.tsx
│   │   ├── DynamicListBuilder.tsx
│   │   ├── EmergencyModal.tsx
│   │   ├── EmergencyNotification.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── HikeBriefing.tsx
│   │   ├── ImagePreviewModal.tsx
│   │   ├── MountainCard.tsx
│   │   ├── MountainCardSkeleton.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostCardSkeleton.tsx
│   │   ├── ResponsiveScrollView.tsx
│   │   ├── ScreenWrapper.tsx
│   │   ├── SkeletonEffect.tsx
│   │   └── WeatherWidget.tsx
│   │
│   ├── constants/                 ← Design tokens & config constants
│   │   ├── colors.ts
│   │   ├── constants.ts
│   │   ├── globalStyles.ts
│   │   ├── layout.ts
│   │   ├── legal.ts
│   │   └── statusConfig.ts
│   │
│   ├── core/                      ← Domain logic & data layer
│   │   ├── FirebaseAuthUtil.ts
│   │   │
│   │   ├── config/                ← Firebase configuration
│   │   │   ├── Firebase.js
│   │   │   ├── persistence.js
│   │   │   ├── persistence.native.js
│   │   │   └── requestWebToken.ts
│   │   │
│   │   ├── context/
│   │   │   └── WeatherProvider.js
│   │   │
│   │   ├── error/
│   │   │   └── autherror.ts
│   │   │
│   │   ├── hook/                  ← Legacy hooks (non-refactored)
│   │   │   ├── useAppSubscriptions.ts
│   │   │   ├── useHomeRefresh.ts
│   │   │   ├── useMaintenance.ts
│   │   │   ├── useStats.ts
│   │   │   ├── useTrailOffers.ts
│   │   │   ├── admin/
│   │   │   │   ├── useAdmin.ts
│   │   │   │   ├── useAdminOffer.ts
│   │   │   │   └── useAdminWrite.ts
│   │   │   ├── apply/
│   │   │   │   ├── useApply.ts
│   │   │   │   └── useApplyWrite.ts
│   │   │   ├── auth/
│   │   │   │   └── useSignUp.ts
│   │   │   ├── hike/
│   │   │   │   ├── useCurrentHike.ts
│   │   │   │   ├── useHike.ts
│   │   │   │   └── useHikeWrite.ts
│   │   │   ├── mountain/
│   │   │   │   ├── useMountain.ts
│   │   │   │   └── useMountainWrite.ts
│   │   │   ├── navigation/
│   │   │   │   ├── useAdminNavigation.ts
│   │   │   │   ├── useAppNavigation.ts
│   │   │   │   ├── useLandingNavigation.ts
│   │   │   │   ├── useProfileNavigation.ts
│   │   │   │   └── useSuperadminNavigation.ts
│   │   │   ├── notification/
│   │   │   │   ├── useNotification.ts
│   │   │   │   └── useViewNotification.ts
│   │   │   ├── offer/
│   │   │   │   ├── useOfferDomain.ts
│   │   │   │   ├── useOfferWrite.ts
│   │   │   │   └── useTrailOffer.ts
│   │   │   ├── recommendation/
│   │   │   │   └── useRecommendation.ts
│   │   │   ├── review/
│   │   │   │   ├── useReview.ts
│   │   │   │   ├── useReviewWrite.ts
│   │   │   │   └── useWriteReview.ts
│   │   │   ├── superadmin/
│   │   │   │   ├── useApplication.ts
│   │   │   │   ├── useManageApplication.ts
│   │   │   │   ├── useSuperadmin.ts
│   │   │   │   ├── useSuperadminDomain.ts
│   │   │   │   └── useSuperadminWrite.ts
│   │   │   ├── trail/
│   │   │   │   ├── useHikerGPS.ts
│   │   │   │   ├── useTrail.ts
│   │   │   │   ├── useTrailDomain.ts
│   │   │   │   ├── useTrailStats.ts
│   │   │   │   ├── useTrailView.ts
│   │   │   │   └── useTrailWrite.ts
│   │   │   ├── user/
│   │   │   │   ├── useApply.ts
│   │   │   │   ├── useAuthHook.ts
│   │   │   │   ├── useDeleteProfile.ts
│   │   │   │   ├── useDevicePermissions.ts
│   │   │   │   ├── useEditProfile.ts
│   │   │   │   ├── useEmergencyContact.ts
│   │   │   │   ├── useForgotPassword.ts
│   │   │   │   ├── useNotifyPermission.ts
│   │   │   │   ├── usePreference.ts
│   │   │   │   ├── useRouteGuard.ts
│   │   │   │   ├── useUser.ts
│   │   │   │   └── useUserWrite.ts
│   │   │   └── weather/
│   │   │       └── useWeather.ts
│   │   │
│   │   ├── interface/             ← Shared TypeScript interfaces
│   │   │   ├── domainHookInterface.ts
│   │   │   ├── formFieldInterface.ts
│   │   │   ├── repositoryInterface.ts
│   │   │   └── storeInterface.ts
│   │   │
│   │   ├── models/                ← Domain models (facade pattern)
│   │   │   ├── Feature.md
│   │   │   ├── FeatureOverview.md
│   │   │   ├── RefactorStatus.md
│   │   │   │
│   │   │   ├── Admin/
│   │   │   │   ├── Admin.ts              ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useAdmin.ts
│   │   │   │   │   ├── useAdminItem.ts
│   │   │   │   │   └── useAdminList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Admin.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── AdminRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── adminStore.native.ts
│   │   │   │   │   ├── adminStore.ts
│   │   │   │   │   ├── adminStore.web.ts
│   │   │   │   │   └── adminStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       └── AdminFactory.ts
│   │   │   │
│   │   │   ├── Application/
│   │   │   │   ├── Application.ts         ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useApplication.ts
│   │   │   │   │   ├── useApplicationItem.ts
│   │   │   │   │   └── useApplicationList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Application.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── applicationRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── applicationStore.native.ts
│   │   │   │   │   ├── applicationStore.ts
│   │   │   │   │   ├── applicationStore.web.ts
│   │   │   │   │   └── applicationStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       └── ApplicationFactory.ts
│   │   │   │
│   │   │   ├── Booking/
│   │   │   │   ├── Booking.ts             ← Facade
│   │   │   │   ├── BookingFeature.md
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useBookingAdmin.ts
│   │   │   │   │   ├── useBookingAdminItem.ts
│   │   │   │   │   ├── useBookingAdminList.ts
│   │   │   │   │   ├── useBookingDelete.ts
│   │   │   │   │   ├── useBookingOfferAdminList.ts
│   │   │   │   │   ├── useBookingUser.ts
│   │   │   │   │   ├── useBookingUserItem.ts
│   │   │   │   │   └── useBookingUserList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   ├── Booking.types.ts
│   │   │   │   │   └── IBooking.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── BookingRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── bookingStore.native.ts
│   │   │   │   │   ├── bookingStore.ts
│   │   │   │   │   ├── bookingStore.web.ts
│   │   │   │   │   └── bookingStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       ├── Booking.logic.ts
│   │   │   │       ├── Booking.utils.ts
│   │   │   │       ├── BookingFactory.ts
│   │   │   │       └── getUserBookingItem.ts
│   │   │   │
│   │   │   ├── Business/
│   │   │   │   ├── Business.ts            ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useBusiness.ts
│   │   │   │   │   ├── useBusinessItem.ts
│   │   │   │   │   └── useBusinessList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Business.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── businessRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── businessStore.native.ts
│   │   │   │   │   ├── businessStore.ts
│   │   │   │   │   ├── businessStore.web.ts
│   │   │   │   │   └── businessStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       ├── Business.logic.ts
│   │   │   │       └── BusinessFactory.ts
│   │   │   │
│   │   │   ├── Cancellation/
│   │   │   │   ├── Cancellation.ts        ← Facade
│   │   │   │   ├── CancellationFeature.md
│   │   │   │   ├── __tests__/
│   │   │   │   │   └── Cancellation.test.ts
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useCancellationAdmin.ts
│   │   │   │   │   ├── useCancellationAdminItem.ts
│   │   │   │   │   ├── useCancellationAdminList.ts
│   │   │   │   │   ├── useCancellationUser.ts
│   │   │   │   │   ├── useCancellationUserItem.ts
│   │   │   │   │   └── useCancellationUserList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Cancellation.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── CancellationRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── cancellationStore.native.ts
│   │   │   │   │   ├── cancellationStore.ts
│   │   │   │   │   ├── cancellationStore.web.ts
│   │   │   │   │   └── cancellationStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       ├── Cancellation.utils.ts
│   │   │   │       └── CancellationFactory.ts
│   │   │   │
│   │   │   ├── Group/
│   │   │   │   ├── Group.ts               ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useGroup.ts
│   │   │   │   │   ├── useGroupItem.ts
│   │   │   │   │   ├── useGroupList.ts
│   │   │   │   │   ├── useGroupLocation.ts
│   │   │   │   │   └── useGroupRoom.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Group.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── GroupRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── groupStore.native.ts
│   │   │   │   │   ├── groupStore.ts
│   │   │   │   │   ├── groupStore.web.ts
│   │   │   │   │   └── groupStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       ├── getGroupName.ts
│   │   │   │       ├── GroupFactory.ts
│   │   │   │       └── updateGroupOnCancellation.ts
│   │   │   │
│   │   │   ├── Hike/
│   │   │   │   ├── Hike.ts                ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useHikeItem.ts
│   │   │   │   │   ├── useHikeList.ts
│   │   │   │   │   └── useHikeTemp.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Hike.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── HikeRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── hikesStore.native.ts
│   │   │   │   │   ├── hikeStore.native.ts
│   │   │   │   │   ├── hikeStore.ts
│   │   │   │   │   ├── hikeStore.web.ts
│   │   │   │   │   └── hikeStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       └── HikeFactory.ts
│   │   │   │
│   │   │   ├── Leaderboard/
│   │   │   │   ├── Leaderboard.ts         ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useLeaderboard.ts
│   │   │   │   │   └── useLeaderboardItem.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   ├── ILeaderboard.ts
│   │   │   │   │   └── Leaderboard.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── LeaderboardRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── leaderboardStore.native.ts
│   │   │   │   │   ├── leaderboardStore.ts
│   │   │   │   │   ├── leaderboardStore.web.ts
│   │   │   │   │   └── leaderboardStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       ├── Leaderboard.utils.ts
│   │   │   │       └── LeaderboardFactory.ts
│   │   │   │
│   │   │   ├── Location/
│   │   │   │   ├── Location.ts            ← Facade
│   │   │   │   ├── Location.types.ts
│   │   │   │   ├── __tests__/
│   │   │   │   │   └── Location.test.ts
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useLocation.ts
│   │   │   │   │   ├── useLocationItem.ts
│   │   │   │   │   └── useLocationList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Location.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── LocationRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── locationStore.native.ts
│   │   │   │   │   ├── locationStore.ts
│   │   │   │   │   ├── locationStore.web.ts
│   │   │   │   │   └── locationStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       └── LocationFactory.ts
│   │   │   │
│   │   │   ├── Message/
│   │   │   │   ├── Message.ts             ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useMessage.ts
│   │   │   │   │   ├── useMessageItem.ts
│   │   │   │   │   └── useMessageList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Message.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── MessageRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── messageStore.native.ts
│   │   │   │   │   ├── messageStore.ts
│   │   │   │   │   ├── messageStore.web.ts
│   │   │   │   │   └── messageStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       └── MessageFactory.ts
│   │   │   │
│   │   │   ├── Mountain/
│   │   │   │   ├── Mountain.ts            ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useMountain.ts
│   │   │   │   │   ├── useMountainItem.ts
│   │   │   │   │   └── useMountainList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Mountain.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── MountainRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── mountainStore.native.ts
│   │   │   │   │   ├── mountainStore.ts
│   │   │   │   │   ├── mountainStore.web.ts
│   │   │   │   │   └── mountainStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       └── MountainFactory.ts
│   │   │   │
│   │   │   ├── Notification/
│   │   │   │   ├── Notification.ts        ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useNotification.ts
│   │   │   │   │   └── useViewNotification.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Notification.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── NotificationRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── notificationStore.native.ts
│   │   │   │   │   ├── notificationStore.ts
│   │   │   │   │   ├── notificationStore.web.ts
│   │   │   │   │   └── notificationStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       └── NotificationFactory.ts
│   │   │   │
│   │   │   ├── Offer/
│   │   │   │   ├── Offer.md
│   │   │   │   ├── Offer.ts               ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useOfferItem.ts
│   │   │   │   │   ├── useOfferList.ts
│   │   │   │   │   └── useOfferSimilarList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Offer.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── OfferRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── offerStore.native.ts
│   │   │   │   │   ├── offerStore.ts
│   │   │   │   │   ├── offerStore.web.ts
│   │   │   │   │   └── offerStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       ├── getOffer.ts
│   │   │   │       ├── OfferFactory.ts
│   │   │   │       └── OfferUtilities.ts
│   │   │   │
│   │   │   ├── Payment/
│   │   │   │   ├── Payment.ts             ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── usePayment.ts
│   │   │   │   │   ├── usePaymentAdmin.ts
│   │   │   │   │   ├── usePaymentItem.ts
│   │   │   │   │   ├── usePaymentList.ts
│   │   │   │   │   └── usePaymentUser.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Payment.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── PaymentRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── paymentStore.native.ts
│   │   │   │   │   ├── paymentStore.ts
│   │   │   │   │   ├── paymentStore.web.ts
│   │   │   │   │   └── paymentStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       ├── Payment.logic.ts
│   │   │   │       └── PaymentFactory.ts
│   │   │   │
│   │   │   ├── Permission/
│   │   │   │   ├── Permission.ts
│   │   │   │   └── Permission.types.ts
│   │   │   │
│   │   │   ├── Recommendation/
│   │   │   │   ├── Recommendation.ts      ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useRecommendation.ts
│   │   │   │   │   └── useRecommendationItem.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Recommendation.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── recommendationRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── recommendationStore.native.ts
│   │   │   │   │   ├── recommendationStore.ts
│   │   │   │   │   ├── recommendationStore.web.ts
│   │   │   │   │   └── recommendationStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       └── RecommendationFactory.ts
│   │   │   │
│   │   │   ├── Reschedule/
│   │   │   │   ├── Reschedule.ts          ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useRescheduleAdminList.ts
│   │   │   │   │   ├── useRescheduleUser.ts
│   │   │   │   │   └── useRescheduleUserList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Reschedule.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── RescheduleRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── rescheduleStore.native.ts
│   │   │   │   │   ├── rescheduleStore.ts
│   │   │   │   │   ├── rescheduleStore.web.ts
│   │   │   │   │   └── rescheduleStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       └── RescheduleFactory.ts
│   │   │   │
│   │   │   ├── Review/
│   │   │   │   ├── Review.ts              ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useReview.ts
│   │   │   │   │   ├── useReviewItem.ts
│   │   │   │   │   └── useReviewList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── Review.types.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── ReviewRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── reviewStore.native.ts
│   │   │   │   │   ├── reviewStore.ts
│   │   │   │   │   ├── reviewStore.web.ts
│   │   │   │   │   └── reviewStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       ├── Review.converter.ts
│   │   │   │       ├── Review.logic.ts
│   │   │   │       └── ReviewFactory.ts
│   │   │   │
│   │   │   ├── Trail/
│   │   │   │   ├── Trail.ts               ← Facade
│   │   │   │   ├── TrailFeature.md
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useTrail.ts
│   │   │   │   │   ├── useTrailItem.ts
│   │   │   │   │   └── useTrailList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   ├── ITrail.ts
│   │   │   │   │   └── Trail.types.ts
│   │   │   │   ├── logic/
│   │   │   │   │   ├── GeoJSONProcessor.ts
│   │   │   │   │   ├── Trail.logic.ts
│   │   │   │   │   └── TrailComputation.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── TrailRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── trailsStore.native.ts
│   │   │   │   │   ├── trailsStore.ts
│   │   │   │   │   ├── trailsStore.web.ts
│   │   │   │   │   ├── trailStore.native.ts
│   │   │   │   │   ├── trailStore.ts
│   │   │   │   │   ├── trailStore.web.ts
│   │   │   │   │   └── trailStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       ├── GeoJSONProcessor.ts
│   │   │   │       ├── Trail.logic.ts
│   │   │   │       ├── TrailComputation.ts
│   │   │   │       └── TrailFactory.ts
│   │   │   │
│   │   │   ├── User/
│   │   │   │   ├── Preference.ts
│   │   │   │   ├── User.ts               ← Facade
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useHikerProfile.ts
│   │   │   │   │   ├── useUser.ts
│   │   │   │   │   ├── useUserItem.ts
│   │   │   │   │   └── useUserList.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   ├── SignUp.types.ts
│   │   │   │   │   └── User.types.ts
│   │   │   │   ├── logic/
│   │   │   │   │   └── User.logic.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── UserRepository.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── userStore.native.ts
│   │   │   │   │   ├── userStore.ts
│   │   │   │   │   ├── userStore.web.ts
│   │   │   │   │   └── userStoreCreator.ts
│   │   │   │   └── utils/
│   │   │   │       ├── User.logic.ts
│   │   │   │       └── UserFactory.ts
│   │   │   │
│   │   │   └── utils/
│   │   │       └── upsert.ts
│   │   │
│   │   ├── repositories/         ← Legacy flat repositories
│   │   │   ├── authRepository.ts
│   │   │   ├── fileRepository.ts
│   │   │   ├── mountainRepository.ts
│   │   │   ├── paymentRepository.ts
│   │   │   ├── userRepository.ts
│   │   │   └── weatherRepository.ts
│   │   │
│   │   ├── stores/                ← Legacy flat stores
│   │   │   ├── dataStore.ts
│   │   │   ├── fileStore.ts
│   │   │   ├── paymentsStore.ts
│   │   │   ├── usersStore.ts
│   │   │   ├── weatherStore.ts
│   │   │   └── authStores/
│   │   │       ├── authStore.native.ts
│   │   │       ├── authStore.ts
│   │   │       ├── authStore.web.ts
│   │   │       └── authStoreCreator.ts
│   │   │
│   │   ├── test/
│   │   │   └── firebase-postinstall-mock.js
│   │   │
│   │   ├── types/                 ← Shared enums & type utilities
│   │   │   ├── Enum.ts
│   │   │   ├── Property.ts
│   │   │   ├── Unit.ts
│   │   │   ├── ValidationStructure.ts
│   │   │   └── weather.ts
│   │   │
│   │   └── utility/               ← Shared utility functions
│   │       ├── date.ts
│   │       ├── editProperty.ts
│   │       ├── errorFormatter.ts
│   │       ├── formatTime.ts
│   │       ├── getSearchParam.ts
│   │       ├── hikeStorage.ts
│   │       ├── locationTask.ts
│   │       ├── parseCSV.ts
│   │       ├── pay.ts
│   │       ├── recommendation.ts
│   │       ├── setFinalValue.ts
│   │       ├── uploadFile.ts
│   │       ├── validate.ts
│   │       ├── weatherHelpers.ts
│   │       └── __tests__/
│   │           ├── PaymentManager.test.ts
│   │           ├── PayMongoProvider.test.ts
│   │           └── weather.test.ts
│   │
│   ├── features/                  ← Feature-based UI screens
│   │   │
│   │   ├── Admin/
│   │   │   ├── hooks/
│   │   │   │   ├── useBookingFilters.ts
│   │   │   │   ├── useOfferFilters.ts
│   │   │   │   └── useReviewLogic.ts
│   │   │   └── screens/
│   │   │       ├── DashboardScreen.tsx
│   │   │       ├── Booking/
│   │   │       │   ├── ReviewScreen.tsx
│   │   │       │   ├── components/
│   │   │       │   │   ├── ActivityLog.tsx
│   │   │       │   │   ├── AdminActionMenu.tsx
│   │   │       │   │   ├── AdminRefundModal.tsx
│   │   │       │   │   ├── DocumentReviewCard.tsx
│   │   │       │   │   └── HikerProfileCard.tsx
│   │   │       │   └── tabs/
│   │   │       │       ├── DocumentTab.tsx
│   │   │       │       └── PaymentTab.tsx
│   │   │       ├── Offer/
│   │   │       │   ├── OfferListScreen.tsx
│   │   │       │   ├── OfferViewScreen.tsx
│   │   │       │   ├── OfferWriteScreen.tsx
│   │   │       │   └── components/
│   │   │       │       ├── AdminBookingCard.tsx
│   │   │       │       ├── OfferCard.tsx
│   │   │       │       ├── OfferSummaryCard.tsx
│   │   │       │       ├── ScheduleBuilderModal.tsx
│   │   │       │       └── SlotsCounter.tsx
│   │   │       └── Personnel/
│   │   │           ├── PersonnelListScreen.tsx
│   │   │           └── PersonnelWriteScreen.tsx
│   │   │
│   │   ├── Auth/
│   │   │   ├── components/
│   │   │   │   ├── MountainSelectChip.tsx
│   │   │   │   ├── SelectionChip.tsx
│   │   │   │   └── SelectionOption.tsx
│   │   │   ├── screens/
│   │   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   │   ├── InformationScreen.tsx
│   │   │   │   ├── LandingScreen.tsx
│   │   │   │   ├── LogInScreen.tsx
│   │   │   │   ├── PreferenceScreen.tsx
│   │   │   │   ├── ResetPasswordScreen.tsx
│   │   │   │   ├── SignUpScreen.tsx
│   │   │   │   └── TACScreen.tsx
│   │   │   └── styles/
│   │   │       └── AuthStyles.ts
│   │   │
│   │   ├── Book/
│   │   │   ├── components/
│   │   │   │   ├── BookingCard.tsx
│   │   │   │   ├── BookTabs.tsx
│   │   │   │   ├── OfferCalendar.tsx
│   │   │   │   ├── OfferCard.tsx
│   │   │   │   ├── ProgressStep.tsx
│   │   │   │   └── TermsSignature.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useBookingFilters.ts
│   │   │   └── screens/
│   │   │       ├── Booking/
│   │   │       │   ├── BookingScreen.tsx
│   │   │       │   ├── DetailsScreen.tsx
│   │   │       │   ├── OffersScreen.tsx
│   │   │       │   └── StatusScreen.tsx
│   │   │       ├── MyBookings/
│   │   │       │   ├── BookingDetailsScreen.tsx
│   │   │       │   ├── MyBookingsScreen.tsx
│   │   │       │   └── components/
│   │   │       │       ├── AccordionItem.tsx
│   │   │       │       ├── BookingOverviewCard.tsx
│   │   │       │       ├── BookingStatus.tsx
│   │   │       │       ├── CancellationReasonCard.tsx
│   │   │       │       ├── HeroHeader.tsx
│   │   │       │       ├── PaymentSummaryCard.tsx
│   │   │       │       ├── QuickInfoCard.tsx
│   │   │       │       ├── ReasonModal.tsx
│   │   │       │       └── RescheduleModal.tsx
│   │   │       └── Payment/
│   │   │           ├── MethodScreen.tsx
│   │   │           ├── PaymentScreen.tsx
│   │   │           ├── ReceiptScreen.tsx
│   │   │           └── StatusScreen.tsx
│   │   │
│   │   ├── Community/
│   │   │   ├── hooks/
│   │   │   │   └── useCommunity.ts
│   │   │   └── screens/
│   │   │       ├── CommunityScreen.tsx
│   │   │       ├── Group/
│   │   │       │   ├── ListScreen.tsx
│   │   │       │   ├── RoomScreen.tsx
│   │   │       │   ├── hooks/
│   │   │       │   │   ├── useListScreen.ts
│   │   │       │   │   └── useRoomScreen.ts
│   │   │       │   └── Styles/
│   │   │       │       └── RoomStyles.ts
│   │   │       └── Leaderboard/
│   │   │           ├── LeaderboardScreen.tsx
│   │   │           ├── components/
│   │   │           │   ├── LeaderboardRankCard.tsx
│   │   │           │   ├── MetricFilterTabs.tsx
│   │   │           │   ├── MountainPodium.tsx
│   │   │           │   └── TopUserDetailModal.tsx
│   │   │           └── hooks/
│   │   │               └── useLeaderboardView.ts
│   │   │
│   │   ├── Explore/
│   │   │   └── screens/
│   │   │       └── ExploreScreen.tsx
│   │   │
│   │   ├── Home/
│   │   │   ├── components/
│   │   │   │   ├── WeatherSection.tsx
│   │   │   │   └── WeatherSkeleton.tsx
│   │   │   └── screens/
│   │   │       ├── HomeScreen.tsx
│   │   │       ├── NotificationScreen.tsx
│   │   │       └── WeatherScreen.tsx
│   │   │
│   │   ├── Legal/
│   │   │   └── screens/
│   │   │       ├── PrivacyScreen.tsx
│   │   │       └── TermsScreen.tsx
│   │   │
│   │   ├── Map/
│   │   │   ├── map.types.ts
│   │   │   ├── offlineStyle.ts
│   │   │   ├── onlineStyle.ts
│   │   │   ├── StaticTrailMap.tsx
│   │   │   ├── TrailMap.native.tsx
│   │   │   ├── TrailMap.tsx
│   │   │   └── trailMapAssets.ts
│   │   │
│   │   ├── Navigation/
│   │   │   ├── components/
│   │   │   │   └── UpcomingHikesModal.tsx
│   │   │   └── screens/
│   │   │       ├── HikeRecordingScreen.tsx
│   │   │       ├── NavigationScreen.tsx
│   │   │       └── WriteReviewScreen.tsx
│   │   │
│   │   ├── Profile/
│   │   │   ├── screens/
│   │   │   │   ├── ApplyScreen.tsx
│   │   │   │   └── ProfileScreen.tsx
│   │   │   └── tabs/
│   │   │       ├── HikeLogTab.tsx
│   │   │       └── MilestonesTab.tsx
│   │   │
│   │   ├── Settings/
│   │   │   ├── hooks/
│   │   │   │   └── useProfileForm.ts
│   │   │   ├── screens/
│   │   │   │   ├── AboutScreen.tsx
│   │   │   │   ├── HelpSupportScreen.tsx
│   │   │   │   ├── HikingPreferencesScreen.tsx
│   │   │   │   ├── NotificationSettingsScreen.tsx
│   │   │   │   ├── PrivacyPermissionsScreen.tsx
│   │   │   │   ├── ProfileInfoScreen.tsx
│   │   │   │   ├── SecurityScreen.tsx
│   │   │   │   └── SettingsScreen.tsx
│   │   │   └── styles/
│   │   │       └── ProfileInfoStyles.ts
│   │   │
│   │   ├── SuperAdmin/
│   │   │   ├── components/
│   │   │   │   ├── AnalyticsChart.tsx
│   │   │   │   ├── Drawer.tsx
│   │   │   │   ├── EditPointModal.tsx
│   │   │   │   ├── MetricCard.tsx
│   │   │   │   ├── PendingPanel.tsx
│   │   │   │   ├── PointDetailsModal.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── SuperadminCard.tsx
│   │   │   │   ├── SuperadminShell.tsx
│   │   │   │   ├── TrailCard.tsx
│   │   │   │   └── charts/
│   │   │   │       ├── HikerAreaChart.tsx
│   │   │   │       ├── RegionalBarChart.tsx
│   │   │   │       └── UserRolesDonutChart.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useApplicationList.ts
│   │   │   │   ├── useBusinessList.ts
│   │   │   │   ├── useMountainList.ts
│   │   │   │   ├── useTrailList.ts
│   │   │   │   └── useUserList.ts
│   │   │   └── screens/
│   │   │       ├── DashboardScreen.tsx
│   │   │       └── tabs/
│   │   │           ├── ApplicationListScreen.tsx
│   │   │           ├── ApplicationViewScreen.tsx
│   │   │           ├── BusinessListScreen.tsx
│   │   │           ├── MountainListScreen.tsx
│   │   │           ├── MountainWriteScreen.tsx
│   │   │           ├── TrailListScreen.tsx
│   │   │           ├── TrailMapEditorScreen.tsx
│   │   │           ├── TrailWriteScreen.tsx
│   │   │           └── UserListScreen.tsx
│   │   │
│   │   └── Trail/
│   │       ├── components/
│   │       │   └── TrailDetailsComponents.tsx
│   │       ├── screens/
│   │       │   └── TrailScreen.tsx
│   │       ├── tabs/
│   │       │   ├── TrailDetailsTab.tsx
│   │       │   ├── TrailReviewsTab.tsx
│   │       │   └── TrailWeatherTab.tsx
│   │       └── utils/
│   │           └── TrailDetailsHelpers.ts
│   │
│   ├── fields/                    ← Form field definitions
│   │   ├── applicationFields.ts
│   │   ├── bookingFields.ts
│   │   ├── mountainFields.ts
│   │   ├── offerFields.ts
│   │   └── trailFields.ts
│   │
│   ├── hooks/                     ← Shared UI hooks
│   │   ├── useBreakpoints.ts
│   │   ├── useLocation.ts
│   │   ├── useScrollFades.ts
│   │   ├── useWeather.ts
│   │   └── useWebDragScroll.ts
│   │
│   ├── types/                     ← Shared UI types
│   │   └── ui.types.ts
│   │
│   └── utils/                     ← Shared UI utilities
│       ├── dateFormatter.ts
│       └── resolveOfflineFonts.ts
│
├── xemulator_data/                ← Backup emulator data snapshot
│   ├── firebase-export-metadata.json
│   ├── auth_export/
│   │   ├── accounts.json
│   │   └── config.json
│   ├── firestore_export/
│   │   ├── firestore_export.overall_export_metadata
│   │   └── all_namespaces/
│   │       └── all_kinds/
│   │           └── all_namespaces_all_kinds.export_metadata
│   └── storage_export/
│       └── metadata/
│           └── *.json
│
├── .githooks/
│   └── post-checkout
│
└── .github/
    └── ISSUE_TEMPLATE/
        ├── bug_report.md
        └── feature_request.md
```

---

## Layer Quick Reference

| Layer | Location | Description |
| --- | --- | --- |
| **Controllers** | `src/app/` | Expo Router file-based routes — thin wrappers that call screens |
| **Screens** | `src/features/*/screens/` | Feature-grouped UI screens |
| **Components** | `src/components/` | Mandatory shared component library (`Custom*`) |
| **Feature Hooks** | `src/features/*/hooks/` | UI-specific logic co-located with screens |
| **Domain Hooks** | `src/core/models/*/hooks/` | Data-access hooks (co-located, new pattern) |
| **Legacy Hooks** | `src/core/hook/` | Older hooks (pre-refactor) |
| **Facades** | `src/core/models/*/{Domain}.ts` | Public API for each domain model |
| **Interfaces** | `src/core/models/*/interfaces/` | TypeScript type definitions per domain |
| **Stores** | `src/core/models/*/stores/` | Zustand stores (native/web/creator split) |
| **Repositories** | `src/core/models/*/repositories/` | Firestore data access layer |
| **Factories** | `src/core/models/*/utils/*Factory.ts` | Object creation & Firestore converters |
| **Utilities** | `src/core/utility/` | Shared pure functions |
| **Constants** | `src/constants/` | Design tokens, colors, layout values |
| **Legacy Stores** | `src/core/stores/` | Older flat stores (pre-refactor) |
| **Legacy Repos** | `src/core/repositories/` | Older flat repositories (pre-refactor) |
| **Cloud Functions** | `functions/` | Firebase Cloud Functions (payment, etc.) |
| **Recommendation** | `recommendation_engine/` | Python TARS recommendation service |
| **Agent Skills** | `.agents/skills/` | AI agent instruction files |
