import { IBusinessSummary } from "@/src/core/models/Business/Business.types";
import { Offer } from "@/src/core/models/Offer/Offer";
import { Trail } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";

export const TESTUSER = new User({
    id: 'test-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    email: 'test@email.com',
    firstname: 'Test',
    lastname: 'User', 
    username: 'testuser',
    onBoardingComplete: true,   
    role: 'user',
})


export const dummyTrails: Trail[] = [
  new Trail({
    id: "trail-cv-001",
    general: {
      name: "Mt. Pico de Loro",
      address: "Ternate-Nasugbu Hwy",
      province: ["Cavite"],
      mountain: ["Palay-Palay Range"],
      rating: 4.7,
      reviewCount: 120
    },
    difficulty: {
      length: 7.0,
      gain: 664,
      slope: 15,
      obstacles: 2,
      hours: 4,
      circularity: "Out-and-Back",
      quality: ["Q2", "Q3"], // TrailQualityType
      difficulty_points: ["D2", "D3"] // DifficultyPointsType
    },
    geography: { masl: 664, startLat: 14.2128, startLong: 120.6548, endLat: 14.2128, endLong: 120.6548 },
    tourism: { 
        shelter: true, resting: true, information_board: true, 
        clean_water: false, river: false, lake: false, 
        waterfall: false, monument: true, community: true, 
        viewpoint: ["V1", "V2"] // ViewpointType
    }
  }),

  new Trail({
    id: "trail-lg-002",
    general: {
      name: "Mt. Makiling Traverse",
      address: "Los Baños",
      province: ["Laguna"],
      mountain: ["Mt. Makiling"],
      rating: 4.5,
      reviewCount: 85
    },
    difficulty: {
      length: 12.0,
      gain: 1090,
      slope: 20,
      obstacles: 4,
      hours: 8,
      circularity: "Traverse",
      quality: ["Q3"],
      difficulty_points: ["D3", "D4"]
    },
    geography: { masl: 1090, startLat: 14.1508, startLong: 121.2130, endLat: 14.1333, endLong: 121.1833 },
    tourism: { 
        shelter: false, resting: true, information_board: true, 
        clean_water: true, river: true, lake: false, 
        waterfall: true, monument: false, community: false, 
        viewpoint: ["V1", "V3"]
    }
  }),

  new Trail({
    id: "trail-bt-003",
    general: {
      name: "Mt. Batulao",
      address: "Nasugbu",
      province: ["Batangas"],
      mountain: ["Batulao Range"],
      rating: 4.9,
      reviewCount: 310
    },
    difficulty: {
      length: 10.2,
      gain: 811,
      slope: 12,
      obstacles: 1,
      hours: 5,
      circularity: "Circular",
      quality: ["Q1", "Q2"],
      difficulty_points: ["D1", "D2"]
    },
    geography: { masl: 811, startLat: 14.0411, startLong: 120.8014, endLat: 14.0411, endLong: 120.8014 },
    tourism: { 
        shelter: true, resting: true, information_board: true, 
        clean_water: false, river: false, lake: false, 
        waterfall: false, monument: false, community: true, 
        viewpoint: ["V1", "V2", "V3"]
    }
  }),

  new Trail({
    id: "trail-rz-004",
    general: {
      name: "Mt. Daraitan",
      address: "Tanay",
      province: ["Rizal"],
      mountain: ["Sierra Madre"],
      rating: 4.8,
      reviewCount: 420
    },
    difficulty: {
      length: 6.5,
      gain: 739,
      slope: 25,
      obstacles: 3,
      hours: 6,
      circularity: "Out-and-Back",
      quality: ["Q3"],
      difficulty_points: ["D3"]
    },
    geography: { masl: 739, startLat: 14.5774, startLong: 121.4128, endLat: 14.5774, endLong: 121.4128 },
    tourism: { 
        shelter: false, resting: false, information_board: true, 
        clean_water: false, river: true, lake: false, 
        waterfall: false, monument: false, community: true, 
        viewpoint: ["V2"]
    }
  }),

  new Trail({
    id: "trail-qz-005",
    general: {
      name: "Mt. Banahaw de Lucban",
      address: "Lucban",
      province: ["Quezon"],
      mountain: ["Mt. Banahaw"],
      rating: 4.6,
      reviewCount: 55
    },
    difficulty: {
      length: 9.4,
      gain: 1875,
      slope: 30,
      obstacles: 5,
      hours: 10,
      circularity: "Out-and-Back",
      quality: ["Q3"],
      difficulty_points: ["D4"]
    },
    geography: { masl: 1875, startLat: 14.1167, startLong: 121.5000, endLat: 14.1167, endLong: 121.5000 },
    tourism: { 
        shelter: true, resting: false, information_board: false, 
        clean_water: true, river: true, lake: false, 
        waterfall: true, monument: true, community: false, 
        viewpoint: ["V1", "V3"]
    }
  })
];

// --- Dummy Businesses ---

export const dummyBusinesses: IBusinessSummary[] = [
  { id: "biz-001", name: "SummitQuest Adventures" },
  { id: "biz-002", name: "TrailBlaze Outdoors" },
  { id: "biz-003", name: "PeakPath Tours" },
];

// --- Dummy Offers ---

export const dummyOffers: Offer[] = [
  // Offers for Mt. Pico de Loro (trail-cv-001)
  new Offer({
    id: "offer-001",
    createdAt: new Date("2026-01-05"),
    updatedAt: new Date("2026-01-05"),
    business: dummyBusinesses[0],
    trail: { id: "trail-cv-001", name: "Mt. Pico de Loro" },
    date: new Date("2026-04-05"),
    price: 1200,
    maxPax: 20,
    minPax: 5,
    reservedPax: 8,
    documents: ["valid_id", "medical_certificate"],
    inclusions: ["guide fee", "environmental fee", "packed lunch"],
    description: "Experience the iconic parrot-shaped rock formation of Pico de Loro with a certified guide and full support crew.",
    schedule: [
      {
        day: 1,
        activities: [
          { time: new Date("2026-04-05T04:00:00"), event: "Assembly at jump-off point, briefing" },
          { time: new Date("2026-04-05T05:00:00"), event: "Start trek to campsite" },
          { time: new Date("2026-04-05T08:00:00"), event: "Arrive at Pico de Loro summit" },
          { time: new Date("2026-04-05T09:30:00"), event: "Descend back to jump-off" },
          { time: new Date("2026-04-05T13:00:00"), event: "End of activity, dispersal" },
        ]
      }
    ]
  }),

  new Offer({
    id: "offer-002",
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-10"),
    business: dummyBusinesses[1],
    trail: { id: "trail-cv-001", name: "Mt. Pico de Loro" },
    date: new Date("2026-04-19"),
    price: 950,
    maxPax: 15,
    minPax: 3,
    reservedPax: 3,
    documents: ["valid_id"],
    inclusions: ["guide fee", "environmental fee"],
    description: "Budget-friendly day hike to Pico de Loro. Bring your own food and water. Great for beginners and intermediate hikers.",
    schedule: [
      {
        day: 1,
        activities: [
          { time: new Date("2026-04-19T05:00:00"), event: "Meet and greet at jump-off" },
          { time: new Date("2026-04-19T05:30:00"), event: "Begin ascent" },
          { time: new Date("2026-04-19T09:00:00"), event: "Summit photo opportunity" },
          { time: new Date("2026-04-19T10:00:00"), event: "Descent" },
          { time: new Date("2026-04-19T14:00:00"), event: "End of hike" },
        ]
      }
    ]
  }),

  // Offers for Mt. Makiling Traverse (trail-lg-002)
  new Offer({
    id: "offer-003",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
    business: dummyBusinesses[2],
    trail: { id: "trail-lg-002", name: "Mt. Makiling Traverse" },
    date: new Date("2026-05-02"),
    price: 3500,
    maxPax: 12,
    minPax: 6,
    reservedPax: 6,
    documents: ["valid_id", "medical_certificate", "waiver"],
    inclusions: ["guide fee", "porters", "meals", "camping equipment", "park fee"],
    description: "Full traverse of the mystical Mt. Makiling. A 2-day adventure through dense rainforest and challenging terrain for experienced hikers.",
    schedule: [
      {
        day: 1,
        activities: [
          { time: new Date("2026-05-02T06:00:00"), event: "Assembly at UPLB, permit processing" },
          { time: new Date("2026-05-02T07:00:00"), event: "Start trek from Sto. Tomas trailhead" },
          { time: new Date("2026-05-02T12:00:00"), event: "Lunch break at rest area" },
          { time: new Date("2026-05-02T17:00:00"), event: "Set up camp at designated campsite" },
          { time: new Date("2026-05-02T19:00:00"), event: "Dinner and camp night briefing" },
        ]
      },
      {
        day: 2,
        activities: [
          { time: new Date("2026-05-03T05:00:00"), event: "Early breakfast, break camp" },
          { time: new Date("2026-05-03T06:00:00"), event: "Continue traverse to Peak 2" },
          { time: new Date("2026-05-03T11:00:00"), event: "Summit Peak 2, group photo" },
          { time: new Date("2026-05-03T13:00:00"), event: "Descent to Los Baños exit" },
          { time: new Date("2026-05-03T17:00:00"), event: "End of traverse, dispersal" },
        ]
      }
    ]
  }),

  new Offer({
    id: "offer-004",
    createdAt: new Date("2026-01-20"),
    updatedAt: new Date("2026-01-20"),
    business: dummyBusinesses[0],
    trail: { id: "trail-lg-002", name: "Mt. Makiling Traverse" },
    date: new Date("2026-05-16"),
    price: 2800,
    maxPax: 10,
    minPax: 4,
    reservedPax: 4,
    documents: ["valid_id", "medical_certificate", "waiver"],
    inclusions: ["guide fee", "park fee", "meals", "first aid kit"],
    description: "Guided 2-day Makiling traverse with experienced naturalist guides. Spot rare flora and fauna along the way.",
    schedule: [
      {
        day: 1,
        activities: [
          { time: new Date("2026-05-16T06:30:00"), event: "Meet at UPLB gate, orientation" },
          { time: new Date("2026-05-16T07:30:00"), event: "Begin ascent through primary forest" },
          { time: new Date("2026-05-16T13:00:00"), event: "Packed lunch at midpoint" },
          { time: new Date("2026-05-16T17:30:00"), event: "Arrive at campsite, set up tents" },
        ]
      },
      {
        day: 2,
        activities: [
          { time: new Date("2026-05-17T04:30:00"), event: "Sunrise hike to ridge" },
          { time: new Date("2026-05-17T07:00:00"), event: "Breakfast at camp" },
          { time: new Date("2026-05-17T08:00:00"), event: "Final leg of traverse" },
          { time: new Date("2026-05-17T15:00:00"), event: "Exit and dispersal" },
        ]
      }
    ]
  }),

  // Offers for Mt. Batulao (trail-bt-003)
  new Offer({
    id: "offer-005",
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
    business: dummyBusinesses[1],
    trail: { id: "trail-bt-003", name: "Mt. Batulao" },
    date: new Date("2026-04-12"),
    price: 1500,
    maxPax: 25,
    minPax: 8,
    reservedPax: 15,
    documents: ["valid_id"],
    inclusions: ["guide fee", "registration fee", "snacks", "certificate of completion"],
    description: "Conquer the rolling hills of Mt. Batulao on this fun circular trail. Perfect for first-timers with a great community atmosphere.",
    schedule: [
      {
        day: 1,
        activities: [
          { time: new Date("2026-04-12T05:00:00"), event: "Assembly and registration at jump-off" },
          { time: new Date("2026-04-12T05:30:00"), event: "Trek to Old Trail campsite" },
          { time: new Date("2026-04-12T08:00:00"), event: "Reach summit, snacks and photos" },
          { time: new Date("2026-04-12T09:30:00"), event: "Descend via New Trail" },
          { time: new Date("2026-04-12T12:00:00"), event: "End of hike, certificate distribution" },
        ]
      }
    ]
  }),

  new Offer({
    id: "offer-006",
    createdAt: new Date("2026-02-05"),
    updatedAt: new Date("2026-02-05"),
    business: dummyBusinesses[2],
    trail: { id: "trail-bt-003", name: "Mt. Batulao" },
    date: new Date("2026-04-26"),
    price: 1800,
    maxPax: 20,
    minPax: 6,
    reservedPax: 10,
    documents: ["valid_id", "medical_certificate"],
    inclusions: ["guide fee", "registration fee", "packed lunch", "transport from Tagaytay"],
    description: "Premium Batulao day hike package with shuttle service from Tagaytay, packed lunch, and professional photography.",
    schedule: [
      {
        day: 1,
        activities: [
          { time: new Date("2026-04-26T04:00:00"), event: "Pick-up at Tagaytay rotunda" },
          { time: new Date("2026-04-26T05:30:00"), event: "Arrive at jump-off, briefing" },
          { time: new Date("2026-04-26T06:00:00"), event: "Start hike on circular route" },
          { time: new Date("2026-04-26T09:00:00"), event: "Summit break and packed lunch" },
          { time: new Date("2026-04-26T11:00:00"), event: "Descent and group photo session" },
          { time: new Date("2026-04-26T14:00:00"), event: "Return trip to Tagaytay" },
        ]
      }
    ]
  }),

  // Offers for Mt. Daraitan (trail-rz-004)
  new Offer({
    id: "offer-007",
    createdAt: new Date("2026-02-10"),
    updatedAt: new Date("2026-02-10"),
    business: dummyBusinesses[0],
    trail: { id: "trail-rz-004", name: "Mt. Daraitan" },
    date: new Date("2026-05-09"),
    price: 2200,
    maxPax: 18,
    minPax: 5,
    reservedPax: 9,
    documents: ["valid_id", "waiver"],
    inclusions: ["guide fee", "boat crossing fee", "Tinipak River swim stop", "snacks"],
    description: "Hike Mt. Daraitan and reward yourself with a swim at the famous Tinipak River. Includes river crossing and guided rocky river trek.",
    schedule: [
      {
        day: 1,
        activities: [
          { time: new Date("2026-05-09T04:30:00"), event: "Assembly at Daraitan jump-off" },
          { time: new Date("2026-05-09T05:00:00"), event: "Begin steep ascent to summit" },
          { time: new Date("2026-05-09T08:00:00"), event: "Reach summit, 360° views" },
          { time: new Date("2026-05-09T09:00:00"), event: "Descend to Tinipak River trail" },
          { time: new Date("2026-05-09T11:00:00"), event: "River swim and snack break" },
          { time: new Date("2026-05-09T13:30:00"), event: "Trek back to jump-off, dispersal" },
        ]
      }
    ]
  }),

  new Offer({
    id: "offer-008",
    createdAt: new Date("2026-02-15"),
    updatedAt: new Date("2026-02-15"),
    business: dummyBusinesses[1],
    trail: { id: "trail-rz-004", name: "Mt. Daraitan" },
    date: new Date("2026-05-23"),
    price: 1700,
    maxPax: 15,
    minPax: 4,
    reservedPax: 7,
    documents: ["valid_id"],
    inclusions: ["guide fee", "boat crossing fee", "environmental fee"],
    description: "Standard guided hike to Mt. Daraitan summit with river crossing. Bring your own food and swimwear for the optional river dip.",
    schedule: [
      {
        day: 1,
        activities: [
          { time: new Date("2026-05-23T05:00:00"), event: "Meet at Tanay bus terminal" },
          { time: new Date("2026-05-23T05:30:00"), event: "Habal-habal ride to jump-off" },
          { time: new Date("2026-05-23T06:00:00"), event: "Start hike" },
          { time: new Date("2026-05-23T09:00:00"), event: "Summit and rest" },
          { time: new Date("2026-05-23T10:00:00"), event: "Descent and optional river swim" },
          { time: new Date("2026-05-23T14:00:00"), event: "Return to Tanay, dispersal" },
        ]
      }
    ]
  }),

  // Offers for Mt. Banahaw de Lucban (trail-qz-005)
  new Offer({
    id: "offer-009",
    createdAt: new Date("2026-02-20"),
    updatedAt: new Date("2026-02-20"),
    business: dummyBusinesses[2],
    trail: { id: "trail-qz-005", name: "Mt. Banahaw de Lucban" },
    date: new Date("2026-06-06"),
    price: 4500,
    maxPax: 10,
    minPax: 4,
    reservedPax: 4,
    documents: ["valid_id", "medical_certificate", "waiver", "DENR_permit"],
    inclusions: ["guide fee", "DENR permit", "meals", "camping equipment", "porter service"],
    description: "Sacred and spiritual ascent of Mt. Banahaw de Lucban. A challenging 2-day climb through mystical forests and holy springs.",
    schedule: [
      {
        day: 1,
        activities: [
          { time: new Date("2026-06-06T06:00:00"), event: "Assembly in Lucban, permit processing" },
          { time: new Date("2026-06-06T07:00:00"), event: "Begin climb at Kinabuhayan trailhead" },
          { time: new Date("2026-06-06T11:00:00"), event: "Lunch break at Kalbaryo campsite" },
          { time: new Date("2026-06-06T15:00:00"), event: "Set up high camp" },
          { time: new Date("2026-06-06T18:00:00"), event: "Dinner, rest, and night sky viewing" },
        ]
      },
      {
        day: 2,
        activities: [
          { time: new Date("2026-06-07T04:00:00"), event: "Pre-dawn push for summit" },
          { time: new Date("2026-06-07T07:00:00"), event: "Reach summit, sunrise view" },
          { time: new Date("2026-06-07T08:00:00"), event: "Descend back to high camp, breakfast" },
          { time: new Date("2026-06-07T10:00:00"), event: "Full descent to Lucban" },
          { time: new Date("2026-06-07T16:00:00"), event: "End of climb, dispersal" },
        ]
      }
    ]
  }),

  new Offer({
    id: "offer-010",
    createdAt: new Date("2026-02-25"),
    updatedAt: new Date("2026-02-25"),
    business: dummyBusinesses[0],
    trail: { id: "trail-qz-005", name: "Mt. Banahaw de Lucban" },
    date: new Date("2026-06-20"),
    price: 3800,
    maxPax: 8,
    minPax: 3,
    reservedPax: 3,
    documents: ["valid_id", "medical_certificate", "waiver", "DENR_permit"],
    inclusions: ["guide fee", "DENR permit", "meals", "tent rental"],
    description: "Small-group intimate climb of Mt. Banahaw de Lucban. Low group cap ensures a personal and focused experience with your guide.",
    schedule: [
      {
        day: 1,
        activities: [
          { time: new Date("2026-06-20T05:30:00"), event: "Meet at Lucban church, last-minute gear check" },
          { time: new Date("2026-06-20T06:30:00"), event: "Drive to trailhead, orientation" },
          { time: new Date("2026-06-20T07:00:00"), event: "Begin ascent" },
          { time: new Date("2026-06-20T12:00:00"), event: "Lunch at campsite" },
          { time: new Date("2026-06-20T17:00:00"), event: "Set up camp, dinner" },
        ]
      },
      {
        day: 2,
        activities: [
          { time: new Date("2026-06-21T04:30:00"), event: "Summit push" },
          { time: new Date("2026-06-21T07:30:00"), event: "Summit, photos, and reflection time" },
          { time: new Date("2026-06-21T09:00:00"), event: "Descent begins" },
          { time: new Date("2026-06-21T15:30:00"), event: "Back at trailhead, dispersal" },
        ]
      }
    ]
  }),
];